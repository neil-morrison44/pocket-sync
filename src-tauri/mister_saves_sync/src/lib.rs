mod save_sync;
use async_trait::async_trait;
use std::{
    io::{Cursor, Read},
    path::PathBuf,
    sync::Arc,
};
use tokio::sync::{mpsc::Sender, Mutex};

pub use save_sync::SaveSyncer;
pub struct MiSTerSaveSync {
    host: String,
    user: Arc<String>,
    password: Arc<String>,
    ftp_stream: Mutex<Option<suppaftp::FtpStream>>,
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
    ) -> Result<bool, Box<dyn std::error::Error>> {
        log_channel
            .send(String::from(format!("Connecting to {}:21", self.host)))
            .await?;

        match suppaftp::FtpStream::connect(format!("{}:21", self.host)) {
            Ok(mut ftp_stream) => {
                if let Ok(_) = ftp_stream.login(self.user.as_str(), self.password.as_str()) {
                    self.ftp_stream = Mutex::new(Some(ftp_stream));
                    return Ok(true);
                } else {
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
    }

    async fn find_save_for(
        &self,
        platform: &str,
        game: &str,
        log_channel: &Sender<String>,
    ) -> Result<Option<PathBuf>, Box<dyn std::error::Error>> {
        let mut guard = self.ftp_stream.lock().await;
        let ftp_stream = guard.as_mut().ok_or("ftp_stream not active")?;

        if let Some(mister_system) = pocket_platform_to_mister_system(platform) {
            ftp_stream.cwd(format!("/media/fat/saves/{}", mister_system))?;

            let system_saves = ftp_stream.nlst(None)?;
            let system_saves: Vec<_> = system_saves.into_iter().map(|s| PathBuf::from(s)).collect();

            let game_path = PathBuf::from(game);
            let expected_save_file_name = game_path.file_stem();

            if let Some(found_save) = system_saves
                .into_iter()
                .find(|p| p.file_stem() == expected_save_file_name)
            {
                return Ok(Some(found_save));
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

    async fn read_save(&self, path: &PathBuf) -> Result<Box<dyn Read>, Box<dyn std::error::Error>> {
        let mut guard = self.ftp_stream.lock().await;
        let ftp_stream = guard.as_mut().ok_or("ftp_stream not active")?;

        ftp_stream.cwd(path.parent().unwrap().to_str().unwrap())?;
        let file_name = path.file_name().and_then(|f| f.to_str()).unwrap();
        let save_file = ftp_stream.retr_as_buffer(file_name)?;
        return Ok(Box::new(save_file));
    }

    async fn write_save(
        &self,
        path: &PathBuf,
        file: Box<Mutex<dyn Read + Send>>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut guard = self.ftp_stream.lock().await;
        let ftp_stream = guard.as_mut().ok_or("ftp_stream not active")?;

        ftp_stream.cwd(path.parent().unwrap().to_str().unwrap())?;
        let mut file = file.lock().await;
        let mut file_buf = vec![];
        file.read_to_end(&mut file_buf)?;

        let mut cursor = Cursor::new(&mut file_buf);

        ftp_stream.put_file(
            path.file_name().and_then(|f| f.to_str()).unwrap(),
            &mut cursor,
        )?;

        return Ok(());
    }

    async fn read_timestamp(&self, path: &PathBuf) -> Result<u64, Box<dyn std::error::Error>> {
        let mut guard = self.ftp_stream.lock().await;
        let ftp_stream = guard.as_mut().ok_or("ftp_stream not active")?;

        ftp_stream.cwd(path.parent().unwrap().to_str().unwrap())?;
        let file_name = path.file_name().and_then(|f| f.to_str()).unwrap();
        let modtime = ftp_stream.mdtm(&file_name)?;

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
        _ => None,
    })
    .and_then(|s| Some(String::from(s)))
}
