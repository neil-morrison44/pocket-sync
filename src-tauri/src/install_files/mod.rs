use std::{
    path::PathBuf,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    time::{Duration, SystemTime},
};

use crate::{
    commands::archive::ProgressUpdate,
    files_from_zip::copy_file_from_zip,
    required_files::{DataSlotFile, DataSlotFileStatus},
    root_files::RootFile,
    turbo_downloads::turbo_download_file,
};
use anyhow::Result;
use bytes::Bytes;
use fs_set_times::{SystemTimeSpec, set_mtime};
use futures::StreamExt;
use tokio::sync::mpsc;

pub async fn install_file(
    file: DataSlotFile,
    archive_url: &str,
    turbo: bool,
    pocket_path: &PathBuf,
    progress_tx: mpsc::UnboundedSender<ProgressUpdate>,
    has_been_cancelled: Arc<AtomicBool>,
) -> Result<()> {
    match file.status {
        DataSlotFileStatus::MissingButOnArchive(archive_info)
        | DataSlotFileStatus::NeedsUpdateFromArchive(archive_info) => {
            let full_url = format!("{}/{}", archive_url, archive_info.url);
            let content = {
                if turbo {
                    let has_been_cancelled_clone = has_been_cancelled.clone();
                    turbo_download_file(&full_url, progress_tx.clone(), has_been_cancelled_clone)
                        .await?
                } else {
                    let response = reqwest::get(&full_url).await?;
                    let mut stream = response.bytes_stream();
                    let mut content_buffer = Vec::new();

                    while let Some(chunk) = stream.next().await {
                        if has_been_cancelled.load(std::sync::atomic::Ordering::Relaxed) {
                            return Ok(());
                        }

                        let chunk = chunk?;
                        let _ = progress_tx.send(ProgressUpdate::AddBytes(chunk.len()));
                        content_buffer.extend_from_slice(&chunk);
                    }
                    Bytes::from(content_buffer)
                }
            };

            if has_been_cancelled.load(Ordering::Relaxed) {
                return Ok(());
            }

            let new_file_path = pocket_path.join(&file.path);
            create_parent_folders(&new_file_path).await?;

            let mut dest = tokio::fs::File::create(&new_file_path).await?;
            let mut content_cusror = std::io::Cursor::new(content);
            tokio::io::copy(&mut content_cusror, &mut dest).await?;

            if let Some(mtime) = archive_info.mtime.and_then(|s| s.parse().ok()) {
                let time = SystemTime::UNIX_EPOCH + Duration::from_millis(mtime);
                set_mtime(&new_file_path, SystemTimeSpec::Absolute(time))?;
            };

            Ok(())
        }
        DataSlotFileStatus::FoundAtRoot { root } => {
            let new_file_path = pocket_path.join(&file.path);
            create_parent_folders(&new_file_path).await?;

            match root {
                RootFile::Zipped {
                    zip_file,
                    inner_file,
                    ..
                } => {
                    copy_file_from_zip(&pocket_path.join(zip_file), &inner_file, &new_file_path)
                        .await?;
                    Ok(())
                }
                RootFile::UnZipped { file_name, .. } => {
                    tokio::fs::copy(pocket_path.join(file_name), new_file_path).await?;
                    Ok(())
                }
            }
        }

        DataSlotFileStatus::RootNeedsUpdate { .. }
        | DataSlotFileStatus::NotChecked
        | DataSlotFileStatus::Exists
        | DataSlotFileStatus::NotFound => Ok(()),
    }
}

async fn create_parent_folders(file_path: &PathBuf) -> Result<()> {
    if let Some(parent) = file_path.parent() {
        if !tokio::fs::try_exists(&parent).await? {
            tokio::fs::create_dir_all(&parent).await?;
        }
    }
    Ok(())
}
