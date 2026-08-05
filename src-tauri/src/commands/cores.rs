use crate::{InstancePackageEventPayload, PocketSyncState};
use log::{debug, error};
use tauri::{Emitter, Window};

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
