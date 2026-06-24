use crate::{
    FileMetadata, PocketSyncState,
    app_error::AppError,
    clean_fs::find_dotfiles,
    hashes::{HashCacheState, crc32_for_file},
    saves_zip::remove_leading_slash,
    util::{find_common_path, get_mtime_timestamp},
};
use async_walkdir::{DirEntry, WalkDir};
use futures::{StreamExt, stream};
use log::{debug, trace};
use std::{path::PathBuf, time::SystemTime};

#[tauri::command(async)]
pub async fn walkdir_list_files(
    path: &str,
    extensions: Vec<&str>,
    off_pocket: Option<bool>,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    debug!("Command: walkdir_list_files - {path}");
    let pocket_path = state.0.pocket_path.read().await;
    let dir_path = match off_pocket {
        Some(true) => PathBuf::from(path),
        None | Some(false) => pocket_path.join(remove_leading_slash(path)),
    };

    let arc_lock = state.0.file_locker.find_lock_for(&dir_path).await;
    let _read_lock = arc_lock.read().await;

    if !dir_path.exists() {
        return Ok(vec![]);
    }

    fn is_hidden(entry: &DirEntry) -> bool {
        entry
            .file_name()
            .to_str()
            .map(|s| s.starts_with("."))
            .unwrap_or(false)
    }

    let mut walker = WalkDir::new(&dir_path);
    let dir_path_str = &dir_path.to_str().unwrap();
    let mut file_paths = Vec::new();

    while let Some(Ok(entry)) = walker.next().await {
        match entry.file_type().await {
            Ok(f) => {
                if f.is_file() && !is_hidden(&entry) {
                    let path = entry.path();
                    let path_str = path.to_str().unwrap();
                    let relative_path = path_str.replace(dir_path_str, "");
                    if extensions.is_empty() || extensions.iter().any(|ext| path_str.ends_with(ext))
                    {
                        file_paths.push(relative_path);
                    }
                }
            }
            Err(_) => continue,
        }
    }

    Ok(file_paths)
}

#[tauri::command(async)]
pub async fn find_cleanable_files(
    path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, String> {
    debug!("Command: find_cleanable_files");
    let pocket_path = state.0.pocket_path.read().await;
    let root_path = pocket_path.join(path);
    let files = find_dotfiles(&root_path).await.unwrap();

    Ok(files)
}

#[tauri::command(async)]
pub async fn get_folder_size(folder: PathBuf) -> Result<u128, AppError> {
    debug!("Command: get_folder_size - {}", &folder.display());
    let mut size = 0;
    let mut walker = WalkDir::new(&folder);

    while let Some(Ok(entry)) = walker.next().await {
        if entry.path().is_file() {
            if let Ok(meta) = entry.path().metadata() {
                size += meta.len() as u128;
            }
        }
    }

    Ok(size)
}

#[tauri::command(async)]
pub async fn find_mtime_for_files(
    full_file_paths: Vec<PathBuf>,
) -> Result<Vec<Option<u64>>, AppError> {
    debug!("Command: find_mtime_for_files - {}", full_file_paths.len());
    let paths_stream = stream::iter(full_file_paths);

    let results = paths_stream
        .map(|full_path| async move {
            match get_mtime_timestamp(&full_path).await {
                Ok(mtime) => Some(mtime),
                Err(err) => {
                    eprintln!("Error processing {:?}: {}", full_path, err);
                    None // Return None for errors
                }
            }
        })
        .buffered(100)
        .collect::<Vec<Option<u64>>>()
        .await;

    Ok(results)
}

#[tauri::command(async)]
pub async fn save_multiple_files(
    state: tauri::State<'_, PocketSyncState>,
    paths: Vec<&str>,
    data: Vec<Vec<u8>>,
) -> Result<(), AppError> {
    debug!("Command: save_multiple_files");
    let pocket_path = state.0.pocket_path.read().await;

    let all_paths: Vec<PathBuf> = paths.iter().map(|p| pocket_path.join(p)).collect();
    let common_dir = find_common_path(&all_paths).unwrap();

    let arc_lock = state.0.file_locker.find_lock_for(&common_dir).await;
    let _write_lock = arc_lock.write().await;

    for (file_path, file_data) in all_paths.iter().zip(data) {
        tokio::fs::write(file_path, file_data).await?;
    }

    Ok(())
}

#[tauri::command(async)]
pub async fn get_file_metadata(
    state: tauri::State<'_, PocketSyncState>,
    hash_cache: tauri::State<'_, HashCacheState>,
    file_path: &str,
) -> Result<FileMetadata, AppError> {
    trace!("Command: get_file_metadata");
    let pocket_path = state.0.pocket_path.read().await;
    let hash_cache = hash_cache.inner();
    let full_path = pocket_path.join(file_path);

    let crc32 = crc32_for_file(&full_path, Some(hash_cache)).await?;

    let metadata = tokio::fs::metadata(full_path)
        .await
        .and_then(|m| m.modified())?;

    let timestamp = metadata
        .duration_since(SystemTime::UNIX_EPOCH)
        .and_then(|d| Ok(d.as_secs()))?;

    Ok(FileMetadata {
        timestamp_secs: timestamp,
        crc32,
    })
}
