use anyhow::Result;
use std::{path::PathBuf, time::SystemTime};

pub async fn get_mtime_timestamp(path: &PathBuf) -> Result<u64> {
    let metadata = tokio::fs::metadata(path).await.and_then(|m| m.modified())?;

    let timestamp = metadata
        .duration_since(SystemTime::UNIX_EPOCH)
        .and_then(|d| Ok(d.as_secs()))?;

    Ok(timestamp)
}
