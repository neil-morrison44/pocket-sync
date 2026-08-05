use crate::app_error::AppError;
use crate::file_cache::clear_file_caches;
use log::debug;
use tauri::Manager;

#[tauri::command(async)]
pub async fn clear_file_cache(app_handle: tauri::AppHandle) -> Result<(), AppError> {
    debug!("Command: clear_file_cache");
    if let Ok(cache_dir) = app_handle.path().app_cache_dir() {
        clear_file_caches(&cache_dir).await?
    }
    Ok(())
}
