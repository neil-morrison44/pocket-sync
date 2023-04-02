use async_trait::async_trait;
use std::{io::Read, path::PathBuf};
use tokio::sync::Mutex;

#[async_trait]
pub trait SaveSyncer {
    async fn connect(
        &mut self,
        log_channel: &tokio::sync::mpsc::Sender<String>,
    ) -> Result<bool, Box<dyn std::error::Error + Send + Sync>>;

    async fn disconnect(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>>;

    async fn heartbeat(&mut self) -> Result<bool, Box<dyn std::error::Error + Send + Sync>>;

    async fn find_save_for(
        &self,
        platform: &str,
        game: &str,
        log_channel: &tokio::sync::mpsc::Sender<String>,
    ) -> Result<Option<PathBuf>, Box<dyn std::error::Error + Send + Sync>>;

    async fn read_save(
        &self,
        path: &PathBuf,
    ) -> Result<Box<dyn Read + Send>, Box<dyn std::error::Error + Send + Sync>>;

    async fn write_save(
        &self,
        path: &PathBuf,
        file: Box<dyn Read + Send>,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>>;

    async fn read_timestamp(
        &self,
        path: &PathBuf,
    ) -> Result<u64, Box<dyn std::error::Error + Send + Sync>>;
}
