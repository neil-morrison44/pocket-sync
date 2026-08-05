use crate::{PocketSyncState, app_error::AppError, file_cache::get_file_with_cache};
use log::debug;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, io::ErrorKind, path::Path};
use tauri::Manager;
use tokio::{fs, io::AsyncReadExt};

#[derive(Serialize, Deserialize)]
pub struct PlatformData {
    category: String,
    name: String,
    manufacturer: String,
    year: u32,
}

#[derive(Deserialize)]
struct PlatformFile {
    platform: PlatformData,
}

pub type PlatformShortName = String;

#[derive(Serialize, Deserialize)]
pub struct FullPlatformData {
    active: HashMap<PlatformShortName, PlatformData>,
    archived: HashMap<PlatformShortName, PlatformData>,
}

#[tauri::command(async)]
pub async fn all_platform_data(
    state: tauri::State<'_, PocketSyncState>,
    _app_handle: tauri::AppHandle,
) -> Result<FullPlatformData, AppError> {
    debug!("Command: all_platform_data");

    let (platforms_path, platforms_archive_path) = {
        let pocket_path = state.0.pocket_path.read().await;
        let platforms_path = pocket_path.join("Platforms");
        let platforms_archive_path = platforms_path.join("_archive");
        (platforms_path, platforms_archive_path)
    };

    let active = read_platforms_from_dir(&platforms_path).await?;
    let archived = read_platforms_from_dir(&platforms_archive_path).await?;

    Ok(FullPlatformData { active, archived })
}

async fn read_platforms_from_dir(
    dir: &Path,
) -> Result<HashMap<PlatformShortName, PlatformData>, AppError> {
    let mut platforms = HashMap::new();
    if !dir.exists() || !dir.is_dir() {
        return Ok(platforms);
    }

    let mut entries = tokio::fs::read_dir(dir).await?;
    let mut tasks = Vec::new();

    while let Ok(Some(entry)) = entries.next_entry().await {
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Some(file_stem) = path.file_stem().and_then(|s| s.to_str()) {
                if file_stem.starts_with('.') {
                    continue;
                }

                let path_clone = path.clone();
                let stem_string = file_stem.to_string();

                tasks.push(tokio::spawn(async move {
                    let mut attempts = 0;
                    let max_attempts = 5;

                    let content = loop {
                        attempts += 1;
                        match tokio::fs::read_to_string(&path_clone).await {
                            Ok(c) => break Some(c),
                            Err(e) => {
                                if attempts >= max_attempts {
                                    debug!(
                                        "Failed to read {:?} after {} attempts: {}",
                                        path_clone, max_attempts, e
                                    );
                                    break None;
                                }
                                let backoff_ms = 5 * attempts as u64;
                                tokio::time::sleep(std::time::Duration::from_millis(backoff_ms))
                                    .await;
                            }
                        }
                    };

                    if let Some(json_str) = content {
                        match serde_json::from_str::<PlatformFile>(&json_str) {
                            Ok(file_data) => Some((stem_string, file_data.platform)),
                            Err(e) => {
                                println!("Failed to parse JSON {:?}: {}", path_clone, e);
                                None
                            }
                        }
                    } else {
                        None
                    }
                }));
            }
        }
    }

    for task in tasks {
        if let Ok(Some((short_name, platform_data))) = task.await {
            platforms.insert(short_name, platform_data);
        }
    }

    Ok(platforms)
}

#[tauri::command(async)]
pub async fn all_platform_images(
    state: tauri::State<'_, PocketSyncState>,
    app_handle: tauri::AppHandle,
) -> Result<HashMap<PlatformShortName, Vec<u8>>, AppError> {
    debug!("Command: all_platform_images");

    let platform_images_path = {
        let pocket_path = state.0.pocket_path.read().await;
        pocket_path.join("Platforms/_images")
    };

    let arc_lock = state
        .0
        .file_locker
        .find_lock_for(&platform_images_path)
        .await;
    let _read_lock = arc_lock.read().await;

    let mut images = HashMap::new();

    let mut entries = match tokio::fs::read_dir(&platform_images_path).await {
        Ok(entries) => entries,
        Err(e) => {
            debug!("No _images directory found or unreadable: {}", e);
            return Ok(images);
        }
    };

    let cache_dir = app_handle.path().app_cache_dir().ok();
    let mut tasks = Vec::new();

    while let Ok(Some(entry)) = entries.next_entry().await {
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("bin") {
            if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                let short_name = stem.to_string();
                let path_clone = path.clone();
                let cache_dir_clone = cache_dir.clone();

                tasks.push(tokio::spawn(async move {
                    let mut attempts = 0;
                    let max_attempts = 5;
                    loop {
                        attempts += 1;

                        let result = if let Some(cache) = cache_dir_clone.as_ref() {
                            get_file_with_cache(&path_clone, &cache).await
                        } else {
                            tokio::fs::File::open(&path_clone).await
                        };

                        match result {
                            Ok(mut f) => {
                                let mut buffer = Vec::new();
                                if f.read_to_end(&mut buffer).await.is_ok() {
                                    return Some((short_name, buffer));
                                } else {
                                    return None;
                                }
                            }
                            Err(e) => {
                                if attempts >= max_attempts {
                                    debug!(
                                        "Failed to open {} after {} attempts: {}",
                                        short_name, max_attempts, e
                                    );
                                    return None;
                                }

                                let backoff_ms = 5 * attempts as u64;
                                tokio::time::sleep(std::time::Duration::from_millis(backoff_ms))
                                    .await;
                            }
                        }
                    }
                }));
            }
        }
    }

    for task in tasks {
        if let Ok(Some((short_name, buffer))) = task.await {
            images.insert(short_name.into(), buffer);
        }
    }

    Ok(images)
}

#[tauri::command(async)]
pub async fn archive_unarchive_platforms(
    state: tauri::State<'_, PocketSyncState>,
    archive: Vec<String>,
    unarchive: Vec<String>,
) -> Result<(), AppError> {
    debug!("Command: archive_unarchive_platforms");

    let (platforms_path, platforms_archive_path) = {
        let pocket_path = state.0.pocket_path.read().await;
        let platforms = pocket_path.join("Platforms");
        let archive = platforms.join("_archive");
        (platforms, archive)
    };
    fs::create_dir_all(&platforms_archive_path)
        .await
        .map_err(AppError::from)?;

    for platform in archive {
        let src = platforms_path.join(format!("{}.json", platform));
        let dest = platforms_archive_path.join(format!("{}.json", platform));

        match fs::rename(&src, &dest).await {
            Ok(_) => debug!("Archived platform: {}", platform),
            Err(e) if e.kind() == ErrorKind::NotFound => continue,
            Err(e) => return Err(e.into()),
        }
    }

    for platform in unarchive {
        let src = platforms_archive_path.join(format!("{}.json", platform));
        let dest = platforms_path.join(format!("{}.json", platform));

        match fs::rename(&src, &dest).await {
            Ok(_) => debug!("Unarchived platform: {}", platform),
            Err(e) if e.kind() == ErrorKind::NotFound => continue,
            Err(e) => return Err(e.into()),
        }
    }

    Ok(())
}
