mod save_sync;
use async_trait::async_trait;
use futures::io::AsyncReadExt;
use std::io::Cursor;
use std::net::ToSocketAddrs;
use std::{io::Read, path::PathBuf, sync::Arc};
use tokio::sync::mpsc::Sender;
use tokio::sync::Mutex;

pub use save_sync::{FoundSave, SaveSyncer};
pub struct MiSTerSaveSync {
    host: String,
    user: Arc<String>,
    password: Arc<String>,
    ftp_stream: Mutex<Option<suppaftp::AsyncFtpStream>>,
}

impl MiSTerSaveSync {
    pub fn new(host: &str, user: &str, password: &str) -> MiSTerSaveSync {
        MiSTerSaveSync {
            host: String::from(host),
            user: String::from(user).into(),
            password: String::from(password).into(),
            ftp_stream: Mutex::new(None),
        }
    }
}

#[async_trait]
impl SaveSyncer for MiSTerSaveSync {
    async fn connect(
        &mut self,
        log_channel: &Sender<String>,
    ) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
        log_channel
            .send(format!("Connecting to {}:21...", self.host).into())
            .await?;

        let address = {
            let host = self.host.clone();
            tokio::task::spawn_blocking(move || {
                format!("{}:21", host).to_socket_addrs().and_then(|addrs| {
                    addrs.last().ok_or_else(|| {
                        std::io::Error::new(std::io::ErrorKind::Other, "No addresses found")
                    })
                })
            })
            .await
            .unwrap()
        };

        let ftp_stream = match address {
            Err(err) => {
                log_channel.send(format!("Error: {}", err)).await?;
                return Ok(false);
            }
            Ok(address) => match suppaftp::AsyncFtpStream::connect_timeout(
                address,
                std::time::Duration::from_secs(10),
            )
            .await
            {
                Ok(mut ftp_stream) => ftp_stream
                    .login(self.user.as_str(), self.password.as_str())
                    .await
                    .map(|_| ftp_stream),
                Err(err) => Err(err),
            },
        };

        match ftp_stream {
            Ok(ftp_stream) => {
                self.ftp_stream = Mutex::new(Some(ftp_stream));
                log_channel.send("Connected!".into()).await?;
                Ok(true)
            }
            Err(err) => {
                log_channel.send(format!("Error: {}", err)).await?;
                Ok(false)
            }
        }
    }

    async fn disconnect(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut guard = self.ftp_stream.lock().await;
        let ftp_stream = guard.as_mut().ok_or("ftp_stream not active")?;

        match ftp_stream.quit().await {
            Err(err) => return Err(err.into()),
            Ok(_) => return Ok(()),
        }
    }

    async fn heartbeat(&mut self) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
        let mut guard = self.ftp_stream.lock().await;
        let ftp_stream = guard.as_mut().ok_or("ftp_stream not active")?;

        match ftp_stream.noop().await {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    async fn find_save_for(
        &self,
        platform: &str,
        game: &str,
        log_channel: &Sender<String>,
    ) -> Result<FoundSave, Box<dyn std::error::Error + Send + Sync>> {
        let mut guard = self.ftp_stream.lock().await;
        let ftp_stream = guard.as_mut().ok_or("ftp_stream not active")?;

        match pocket_platform_to_mister_system(platform) {
            None => {
                log_channel
                    .send(format!(
                        "Unable to find MiSTer system for \"{}\"",
                        &platform
                    ))
                    .await
                    .unwrap();
                return Ok(FoundSave::NotSupported);
            }
            Some(mister_system) => {
                let system_path = format!("/media/fat/saves/{}", mister_system);
                let system_saves = ftp_stream.nlst(Some(&system_path)).await?;
                let system_saves: Vec<_> =
                    system_saves.into_iter().map(|s| PathBuf::from(s)).collect();
                let game_path = PathBuf::from(game);
                let expected_save_file_name = game_path.file_stem();

                match system_saves
                    .into_iter()
                    .find(|p| p.file_stem() == expected_save_file_name)
                {
                    Some(found_save) => Ok(FoundSave::Found(
                        PathBuf::from(&system_path).join(found_save),
                    )),
                    None => Ok(FoundSave::NotFound(PathBuf::from(&system_path).join(&game))),
                }
            }
        }
    }

    async fn read_save(
        &self,
        path: &PathBuf,
    ) -> Result<Box<dyn Read + Send>, Box<dyn std::error::Error + Send + Sync>> {
        let mut guard = self.ftp_stream.lock().await;
        let ftp_stream = guard.as_mut().ok_or("ftp_stream not active")?;

        ftp_stream
            .cwd(path.parent().unwrap().to_str().unwrap())
            .await?;
        let file_name = path.file_name().and_then(|f| f.to_str()).unwrap();

        ftp_stream
            .transfer_type(suppaftp::types::FileType::Binary)
            .await?;

        let mut buffer: Vec<u8> = Vec::new();
        if let Ok(mut reader) = ftp_stream.retr_as_stream(file_name).await {
            reader.read_to_end(&mut buffer).await?;
            ftp_stream.finalize_retr_stream(reader).await?;
        }

        let cursor = Cursor::new(buffer);
        Ok(Box::new(cursor))
    }

    async fn write_save(
        &self,
        path: &PathBuf,
        mut file: Box<dyn Read + Send>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut guard = self.ftp_stream.lock().await;
        let ftp_stream = guard.as_mut().ok_or("ftp_stream not active")?;

        ftp_stream
            .cwd(path.parent().unwrap().to_str().unwrap())
            .await?;

        ftp_stream
            .transfer_type(suppaftp::types::FileType::Binary)
            .await?;

        let mut file_buf = vec![];
        file.read_to_end(&mut file_buf)?;
        let mut cursor = futures::io::Cursor::new(&mut file_buf);

        ftp_stream
            .put_file(
                path.file_name().and_then(|f| f.to_str()).unwrap(),
                &mut cursor,
            )
            .await?;

        return Ok(());
    }

    async fn read_timestamp(
        &self,
        path: &PathBuf,
    ) -> Result<u64, Box<dyn std::error::Error + Send + Sync>> {
        let mut guard = self.ftp_stream.lock().await;
        let ftp_stream = guard.as_mut().ok_or("ftp_stream not active")?;

        let parent_path = path.parent().unwrap().to_str().unwrap();
        ftp_stream.cwd(parent_path).await?;
        let file_name = path.file_name().and_then(|f| f.to_str()).unwrap();
        let modtime = ftp_stream.mdtm(&file_name).await?;
        return Ok(modtime.timestamp_millis() as u64);
    }
}

fn pocket_platform_to_mister_system(platform: &str) -> Option<String> {
    Some(match platform {
        "gb" | "gbc" => "GAMEBOY",
        "gg" | "sms" => "SMS",
        "pce" | "pcecd" => "TGFX16",
        "gba" => "GBA",
        "sg1000" => "SG1000",
        "arduboy" => "Arduboy",
        "genesis" => "Genesis",
        "ng" => "NEOGEO",
        "nes" => "NES",
        "snes" => "SNES",
        "supervision" => "SuperVision",
        "poke_mini" => "PokemonMini",
        "wonderswan" => "WonderSwan",
        "gamate" => "Gamate",
        _ => return None,
    })
    .map(String::from)
}
