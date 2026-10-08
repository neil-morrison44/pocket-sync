use std::{
    path::Path,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    time::{Duration, SystemTime},
};

use anyhow::Result;
use bytes::Bytes;
use fs_set_times::{SystemTimeSpec, set_mtime};
use futures::StreamExt;
use tokio::sync::mpsc;

use crate::{
    commands::archive::ProgressUpdate,
    files_from_zip::copy_file_from_zip,
    required_files::{DataSlotFile, DataSlotFileStatus},
    root_files::RootFile,
    turbo_downloads::turbo_download_file,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InstallOutcome {
    Completed { bytes_downloaded: usize },
    Cancelled { bytes_downloaded: usize },
}

pub async fn install_file(
    file: &DataSlotFile,
    archive_url: &str,
    turbo: bool,
    pocket_path: &Path,
    progress_tx: mpsc::UnboundedSender<ProgressUpdate>,
    has_been_cancelled: Arc<AtomicBool>,
) -> Result<InstallOutcome> {
    match &file.status {
        DataSlotFileStatus::MissingButOnArchive(archive_info)
        | DataSlotFileStatus::NeedsUpdateFromArchive(archive_info) => {
            let full_url = format!("{}/{}", archive_url, archive_info.url);

            let content = if turbo {
                turbo_download_file(&full_url, progress_tx.clone(), has_been_cancelled.clone())
                    .await?
            } else {
                let response = reqwest::get(&full_url).await?.error_for_status()?;
                let mut stream = response.bytes_stream();
                let mut content_buffer = Vec::new();

                while let Some(chunk) = stream.next().await {
                    let chunk = chunk?;
                    if has_been_cancelled.load(Ordering::Relaxed) {
                        return Ok(InstallOutcome::Cancelled {
                            bytes_downloaded: content_buffer.len() + chunk.len(),
                        });
                    }
                    let _ = progress_tx.send(ProgressUpdate::AddBytes(chunk.len()));
                    content_buffer.extend_from_slice(&chunk);
                }
                Bytes::from(content_buffer)
            };

            if has_been_cancelled.load(Ordering::Relaxed) {
                return Ok(InstallOutcome::Cancelled {
                    bytes_downloaded: content.len(),
                });
            }

            let new_file_path = pocket_path.join(&file.path);
            create_parent_folders(&new_file_path).await?;
            let total_bytes = content.len();
            tokio::fs::write(&new_file_path, content).await?;

            if let Some(mtime) = archive_info
                .mtime
                .as_deref()
                .and_then(|s| s.parse::<u64>().ok())
            {
                let time = SystemTime::UNIX_EPOCH + Duration::from_millis(mtime);
                set_mtime(&new_file_path, SystemTimeSpec::Absolute(time))?;
            }

            Ok(InstallOutcome::Completed {
                bytes_downloaded: total_bytes,
            })
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
                    copy_file_from_zip(&pocket_path.join(zip_file), inner_file, &new_file_path)
                        .await?;
                    Ok(InstallOutcome::Completed {
                        bytes_downloaded: 0,
                    })
                }
                RootFile::UnZipped { file_name, .. } => {
                    tokio::fs::copy(pocket_path.join(file_name), new_file_path).await?;
                    Ok(InstallOutcome::Completed {
                        bytes_downloaded: 0,
                    })
                }
            }
        }

        DataSlotFileStatus::RootNeedsUpdate { .. }
        | DataSlotFileStatus::NotChecked
        | DataSlotFileStatus::Exists
        | DataSlotFileStatus::NotFound => Ok(InstallOutcome::Completed {
            bytes_downloaded: 0,
        }),
    }
}

async fn create_parent_folders(file_path: &Path) -> Result<()> {
    if let Some(parent) = file_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    Ok(())
}
