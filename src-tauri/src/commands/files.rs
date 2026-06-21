use crate::{
    FileMetadata, PocketSyncState,
    app_error::AppError,
    clean_fs::find_dotfiles,
    file_cache::get_file_with_cache,
    hashes::{HashCacheState, crc32_for_file},
    progress,
    saves_zip::remove_leading_slash,
    util::{find_common_path, get_mtime_timestamp},
};
use async_walkdir::{DirEntry, WalkDir};
use futures::{StreamExt, stream};
use log::{debug, error, trace};
use std::{path::PathBuf, time::SystemTime};
use tauri::{Emitter, Manager, Window};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

#[tauri::command(async)]
pub async fn read_binary_file(
    state: tauri::State<'_, PocketSyncState>,
    path: &str,
    app_handle: tauri::AppHandle,
) -> Result<Vec<u8>, String> {
    debug!("Command: read_binary_file - {path}");
    let pocket_path = state.0.pocket_path.read().await;
    let path = pocket_path.join(path);

    let arc_lock = state.0.file_locker.find_lock_for(&path).await;
    let _read_lock = arc_lock.read().await;

    if let Ok(mut f) = if let Ok(cache_dir) = app_handle.path().app_cache_dir() {
        get_file_with_cache(&path, &cache_dir).await
    } else {
        tokio::fs::File::open(&path).await
    } {
        let mut buffer = vec![];
        f.read_to_end(&mut buffer)
            .await
            .expect(&format!("failed to read file: {:?}", path));

        Ok(buffer)
    } else {
        Err(format!("No file found: {}", path.display()))
    }
}

#[tauri::command(async)]
pub async fn read_text_file(
    state: tauri::State<'_, PocketSyncState>,
    path: &str,
    app_handle: tauri::AppHandle,
) -> Result<String, ()> {
    debug!("Command: read_text_file - {path}");
    let pocket_path = state.0.pocket_path.read().await;
    let path = pocket_path.join(path);

    let arc_lock = state.0.file_locker.find_lock_for(&path).await;
    let _read_lock = arc_lock.read().await;

    let mut f = if let Ok(cache_dir) = app_handle.path().app_cache_dir() {
        get_file_with_cache(&path, &cache_dir).await
    } else {
        tokio::fs::File::open(&path).await
    }
    .expect(&format!("no file found: {:?}", &path));

    let mut file_contents = String::new();
    f.read_to_string(&mut file_contents)
        .await
        .expect(&format!("failed to read file: {:?}", path));
    Ok(file_contents)
}

#[tauri::command(async)]
pub async fn file_exists(
    state: tauri::State<'_, PocketSyncState>,
    path: &str,
) -> Result<bool, AppError> {
    trace!("Command: file_exists - {path}");
    let pocket_path = state.0.pocket_path.read().await;
    let path = pocket_path.join(path);

    let exists = tokio::fs::try_exists(&path).await?;
    Ok(exists)
}

#[tauri::command(async)]
pub async fn save_file(
    path: &str,
    buffer: Vec<u8>,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    debug!("Command: save_file - {path}");
    let file_path = PathBuf::from(path);
    let folder_path = file_path.parent().unwrap();
    let arc_lock = state.0.file_locker.find_lock_for(&file_path).await;
    let _write_lock = arc_lock.write().await;
    tokio::fs::create_dir_all(&folder_path).await.unwrap();
    let mut file = tokio::fs::File::create(file_path).await.unwrap();
    file.write_all(&buffer).await.unwrap();
    file.flush().await.unwrap();
    Ok(true)
}

#[tauri::command(async)]
pub async fn list_files(
    path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    debug!("Command: list_files - {path}");
    let pocket_path = state.0.pocket_path.read().await;
    let dir_path = pocket_path.join(path);

    let arc_lock = state.0.file_locker.find_lock_for(&dir_path).await;
    trace!("list_files lock requested");
    let _read_lock = arc_lock.read().await;
    trace!("list_files lock granted");

    if !tokio::fs::try_exists(&dir_path).await.unwrap() {
        return Ok(vec![]);
    }

    let mut paths = tokio::fs::read_dir(dir_path).await.unwrap();
    let mut results: Vec<_> = Vec::new();

    while let Ok(Some(entry)) = paths.next_entry().await {
        let file_type = entry.file_type().await.unwrap();
        if file_type.is_file() {
            let file_name = entry.file_name();
            let file_name = file_name.to_str().unwrap();

            if !file_name.starts_with(".") {
                results.push(String::from(file_name))
            }
        }
    }

    Ok(results)
}

#[tauri::command(async)]
pub async fn list_folders(
    path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    debug!("Command: list_folders - {path}");
    let pocket_path = state.0.pocket_path.read().await;
    let dir_path = pocket_path.join(path);

    let arc_lock = state.0.file_locker.find_lock_for(&dir_path).await;
    let _read_lock = arc_lock.read().await;

    if !tokio::fs::try_exists(&dir_path).await.unwrap() {
        return Ok(vec![]);
    }

    let mut paths = tokio::fs::read_dir(dir_path).await.unwrap();
    let mut results: Vec<_> = Vec::new();

    while let Ok(Some(entry)) = paths.next_entry().await {
        let file_type = entry.file_type().await.unwrap();
        if file_type.is_dir() {
            let file_name = entry.file_name();
            let file_name = file_name.to_str().unwrap();

            if !file_name.starts_with(".") {
                results.push(String::from(file_name))
            }
        }
    }

    Ok(results)
}

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
pub async fn delete_files(
    paths: Vec<&str>,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    debug!("Command: delete_files");
    let pocket_path = state.0.pocket_path.read().await;

    let tasks: Vec<_> = paths
        .into_iter()
        .filter_map(|path| {
            let file_path = pocket_path.join(path);
            file_path
                .exists()
                .then(|| tokio::fs::remove_file(file_path))
        })
        .collect();

    futures::future::join_all(tasks).await;
    Ok(true)
}

#[tauri::command(async)]
pub async fn copy_files(
    copies: Vec<(&str, &str)>,
    window: Window,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    debug!("Command: copy_files");

    let mut progress = progress::ProgressEmitter::new(Box::new(|event| {
        window.emit("progress-event::copy_files", event).unwrap();
    }));

    progress.begin_work_units(copies.len());

    let all_dests: Vec<PathBuf> = copies
        .iter()
        .map(|(_source, dest)| PathBuf::from(dest))
        .collect();
    let common_dir = find_common_path(&all_dests).unwrap();
    let arc_lock = state.0.file_locker.find_lock_for(&common_dir).await;
    let _write_lock = arc_lock.write().await;

    for (origin, destination) in copies {
        let origin = PathBuf::from(origin);
        let destination = PathBuf::from(&destination);

        if let Err(err) = match tokio::fs::create_dir_all(destination.parent().unwrap()).await {
            Ok(_) => tokio::fs::copy(&origin, &destination).await,
            Err(e) => Err(e),
        } {
            error!("{}", err);
        } else {
            progress.complete_work_units(1);
            progress.set_message("file", Some(&destination.to_string_lossy()));
        }
    }

    Ok(true)
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
pub async fn get_file_metadata_mtime_only(
    state: tauri::State<'_, PocketSyncState>,
    file_path: &str,
) -> Result<u64, AppError> {
    trace!("Command: get_file_metadata_mtime_only");
    let pocket_path = state.0.pocket_path.read().await;
    let full_path = pocket_path.join(file_path);

    Ok(get_mtime_timestamp(&full_path).await?)
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

#[tauri::command(async)]
pub async fn create_folder_if_missing(path: &str) -> Result<bool, ()> {
    debug!("Command: create_folder_if_missing - {path}");
    let folder_path = PathBuf::from(path);
    if !folder_path.exists() {
        tokio::fs::create_dir_all(path).await.unwrap();
        return Ok(true);
    }

    Ok(false)
}
