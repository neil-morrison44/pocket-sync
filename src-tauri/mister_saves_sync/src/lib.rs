mod save_sync;
use async_trait::async_trait;
use futures::io::AsyncReadExt;
use std::io::Cursor;
use std::net::ToSocketAddrs;
use std::{io::Read, path::PathBuf, sync::Arc};
use tokio::sync::mpsc::Sender;
use tokio::sync::Mutex;

pub use save_sync::SaveSyncer;
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

        match format!("{}:21", self.host).to_socket_addrs() {
            Err(err) => {
                log_channel
                    .send(format!("Error: {}", err.to_string()))
                    .await?;
                return Ok(false);
            }
            Ok(socket_addrs) => {
                if let Some(address) = socket_addrs.last() {
                    match suppaftp::AsyncFtpStream::connect_timeout(
                        address,
                        std::time::Duration::from_secs(10),
                    )
                    .await
                    {
                        Ok(mut ftp_stream) => {
                            if let Ok(_) = ftp_stream
                                .login(self.user.as_str(), self.password.as_str())
                                .await
                            {
                                self.ftp_stream = Mutex::new(Some(ftp_stream));
                                log_channel.send(format!("Connected!").into()).await?;
                                return Ok(true);
                            } else {
                                log_channel
                                    .send(format!("Failed to connect").into())
                                    .await?;

                                return Ok(false);
                            }
                        }
                        Err(ftp_error) => {
                            let error_string = ftp_error.to_string();
                            log_channel
                                .send(String::from(format!("Error: {}", error_string)))
                                .await?;
                            return Ok(false);
                        }
                    }
                } else {
                    return Ok(false);
                }
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
    ) -> Result<Option<PathBuf>, Box<dyn std::error::Error + Send + Sync>> {
        println!("finding save for {} on {}", game, platform);
        let mut guard = self.ftp_stream.lock().await;
        let ftp_stream = guard.as_mut().ok_or("ftp_stream not active")?;

        if let Some(mister_system) = pocket_platform_to_mister_system(platform) {
            let system_path = format!("/media/fat/saves/{}", mister_system);
            dbg!(&system_path);
            ftp_stream.cwd(&system_path).await?;
            dbg!("cwd ran?");
            let system_saves = ftp_stream.nlst(None).await?;
            let system_saves: Vec<_> = system_saves.into_iter().map(|s| PathBuf::from(s)).collect();

            let game_path = PathBuf::from(game);
            let expected_save_file_name = game_path.file_stem();

            dbg!(&system_saves);
            if let Some(found_save) = system_saves
                .into_iter()
                .find(|p| p.file_stem() == expected_save_file_name)
            {
                log_channel
                    .send(
                        format!(
                            "Found a MiSTer save for {:?} on {mister_system}",
                            expected_save_file_name.unwrap(),
                        )
                        .into(),
                    )
                    .await?;
                return Ok(Some(PathBuf::from(&system_path).join(found_save)));
            } else {
                log_channel
                    .send(String::from(format!(
                        "Unable to find a MiSTer save for {platform}/{game}",
                    )))
                    .await?;

                return Ok(None);
            }
        } else {
            log_channel
                .send(String::from(format!(
                    "Unable to find a MiSTer system for {platform}"
                )))
                .await?;
            return Ok(None);
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
        println!("waiting for stream lock");
        let mut guard = self.ftp_stream.lock().await;
        println!("granted stream lock");
        let ftp_stream = guard.as_mut().ok_or("ftp_stream not active")?;

        let parent_path = path.parent().unwrap().to_str().unwrap();
        dbg!(parent_path);
        ftp_stream.cwd(parent_path).await?;
        let file_name = path.file_name().and_then(|f| f.to_str()).unwrap();
        println!("{file_name}");
        let modtime = ftp_stream.mdtm(&file_name).await?;

        println!("returning file time");
        return Ok(modtime.timestamp_millis() as u64);
    }
}

fn pocket_platform_to_mister_system(platform: &str) -> Option<String> {
    (match platform {
        "gb" => Some("GAMEBOY"),
        "gbc" => Some("GAMEBOY"),
        "gba" => Some("GBA"),
        "gg" => Some("SMS"),
        "arduboy" => Some("Arduboy"),
        "genesis" => Some("Genesis"),
        "sms" => Some("SMS"),
        "ng" => Some("NEOGEO"),
        "nes" => Some("NES"),
        "snes" => Some("SNES"),
        "supervision" => Some("SuperVision"),
        "pce" => Some("TGFX16"),
        "poke_mini" => Some("PokemonMini"),
        _ => None,
    })
    .and_then(|s| Some(String::from(s)))
}
