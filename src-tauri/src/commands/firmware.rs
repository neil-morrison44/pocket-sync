use crate::{
    PocketSyncState,
    app_error::AppError,
    firmware::{self, FirmwareDetails, FirmwareListItem},
};
use log::debug;

#[tauri::command(async)]
pub async fn get_firmware_versions_list() -> Result<Vec<FirmwareListItem>, AppError> {
    debug!("Command: get_firmware_versions_list");
    Ok(firmware::get_firmware_json().await?)
}

#[tauri::command(async)]
pub async fn get_firmware_release_notes(version: &str) -> Result<FirmwareDetails, AppError> {
    debug!("Command: get_firmware_release_notes");
    Ok(firmware::get_release_notes(version).await?)
}

#[tauri::command(async)]
pub async fn download_firmware(
    url: &str,
    md5: &str,
    file_name: &str,
    state: tauri::State<'_, PocketSyncState>,
    window: tauri::Window,
) -> Result<bool, AppError> {
    debug!("Command: download_firmware");
    let pocket_path = state.0.pocket_path.read().await;
    let file_path = pocket_path.join(file_name);

    let arc_lock = state.0.file_locker.find_lock_for(&pocket_path).await;
    let _write_lock = arc_lock.write().await;

    firmware::download_firmware_file(url, &file_path, &window).await?;

    debug!("firmware downloaded");

    let verify = firmware::verify_firmware_file(&file_path, md5).await?;

    if !verify {
        debug!("firmware verification failed");
        tokio::fs::remove_file(&file_path).await?;
    }

    debug!("firmware verified");

    Ok(verify)
}
