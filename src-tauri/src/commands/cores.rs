use std::collections::HashMap;

use crate::{
    InstancePackageEventPayload, PocketSyncState, app_error::AppError,
    core_json_files::updaters::UpdatersFile,
};
use log::{debug, error};
use tauri::{Emitter, Window};
use tokio::fs::{read_dir, read_to_string};

#[tauri::command(async)]
pub async fn uninstall_core(
    core_name: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    debug!("Command: uninstall_core - {core_name}");
    let pocket_path = state.0.pocket_path.read().await;

    let paths = vec![
        pocket_path.join("Cores").join(core_name),
        pocket_path.join("Presets").join(core_name),
        pocket_path.join("Settings").join(core_name),
    ];

    for path in paths {
        if path.exists() && path.is_dir() {
            tokio::fs::remove_dir_all(path).await.unwrap();
        } else {
            error!("Weird, it's gone already");
        }
    }

    Ok(true)
}

#[tauri::command]
pub async fn list_instance_packageable_cores(
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    debug!("Command: list_instance_packageable_cores");
    let pocket_path = state.0.pocket_path.read().await;
    Ok(instance_packager::find_cores_with_package_json(&pocket_path).unwrap())
}

#[tauri::command]
pub async fn run_packager_for_core(
    state: tauri::State<'_, PocketSyncState>,
    core_name: &str,
    window: Window,
) -> Result<(), ()> {
    debug!("Command: run_packager_for_core");
    let pocket_path = state.0.pocket_path.read().await;

    let emit_event = |file_name, success, message| {
        window
            .emit(
                "instance-packager-event-payload",
                InstancePackageEventPayload {
                    file_name: String::from(file_name),
                    success: success,
                    message: message,
                },
            )
            .unwrap()
    };

    Ok(instance_packager::build_jsons_for_core(
        &pocket_path,
        core_name,
        true,
        |file_name| {
            emit_event(String::from(file_name), true, None);
        },
        |file_name, message| {
            emit_event(String::from(file_name), false, Some(String::from(message)));
        },
    )
    .unwrap())
}

#[tauri::command]
pub async fn get_all_updaters_files(
    state: tauri::State<'_, PocketSyncState>,
) -> Result<HashMap<String, UpdatersFile>, AppError> {
    debug!("Command: get_all_updaters_files");

    let pocket_path = state.0.pocket_path.read().await;
    let cores_directory = pocket_path.join("Cores");

    let mut entries = read_dir(&cores_directory).await?;
    let mut updaters_map = HashMap::new();

    while let Some(entry) = entries.next_entry().await? {
        let path = entry.path();
        if path.is_dir() {
            if let Some(core_name) = path.file_name().and_then(|n| n.to_str()) {
                let updaters_json_path = path.join("updaters.json");
                if updaters_json_path.exists() {
                    let content = read_to_string(&updaters_json_path).await?;
                    let updaters_file: UpdatersFile = serde_json::from_str(&content)?;
                    updaters_map.insert(core_name.to_string(), updaters_file);
                }
            }
        }
    }

    Ok(updaters_map)
}
