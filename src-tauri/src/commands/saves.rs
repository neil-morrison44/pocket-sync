use log::debug;
use std::path::PathBuf;

use crate::{
    BackupSavesResponse, PocketSyncState,
    app_error::AppError,
    hashes::HashCacheState,
    saves_zip::{
        SaveZipFile, build_save_zip, read_save_zip_list, read_saves_in_folder, read_saves_in_zip,
        restore_save_from_zip,
    },
};

#[tauri::command(async)]
pub async fn backup_saves(
    save_paths: Vec<&str>,
    zip_path: &str,
    max_count: usize,
    state: tauri::State<'_, PocketSyncState>,
    hash_cache: tauri::State<'_, HashCacheState>,
) -> Result<bool, ()> {
    debug!("Command: backup_saves");
    let pocket_path = state.0.pocket_path.read().await;
    let hash_cache = hash_cache.inner();
    build_save_zip(&pocket_path, save_paths, zip_path, max_count, hash_cache)
        .await
        .unwrap();

    Ok(true)
}

#[tauri::command(async)]
pub async fn list_backup_saves(
    backup_path: &str,
    hash_cache: tauri::State<'_, HashCacheState>,
) -> Result<BackupSavesResponse, AppError> {
    debug!("Command: list_backup_saves");
    let path = PathBuf::from(backup_path);
    if !path.exists() {
        return Ok(BackupSavesResponse {
            files: vec![],
            exists: false,
        });
    }

    let hash_cache = hash_cache.inner();
    let files = read_save_zip_list(&path, hash_cache).await?;

    Ok(BackupSavesResponse {
        files,
        exists: true,
    })
}

#[tauri::command(async)]
pub async fn list_saves_in_zip(zip_path: &str) -> Result<Vec<SaveZipFile>, AppError> {
    debug!("Command: list_saves_in_zip");
    let path = PathBuf::from(zip_path);
    if !path.exists() {
        return Ok(vec![]);
    }

    Ok(read_saves_in_zip(&path).await?)
}

#[tauri::command(async)]
pub async fn list_saves_on_pocket(
    state: tauri::State<'_, PocketSyncState>,
    hash_cache: tauri::State<'_, HashCacheState>,
) -> Result<Vec<SaveZipFile>, AppError> {
    debug!("Command: list_saves_on_pocket");
    let pocket_path = state.0.pocket_path.read().await;
    let hash_cache = hash_cache.inner();
    let saves_path = pocket_path.join("Saves");
    Ok(read_saves_in_folder(&saves_path, Some(hash_cache)).await?)
}

#[tauri::command(async)]
pub async fn restore_save(
    zip_path: &str,
    file_path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<(), ()> {
    debug!("Command: restore_save");
    let pocket_path = state.0.pocket_path.read().await;
    let path = PathBuf::from(zip_path);
    restore_save_from_zip(&path, file_path, &pocket_path).await;

    Ok(())
}
