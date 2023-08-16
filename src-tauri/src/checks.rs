use serde::{Deserialize, Serialize};
use std::{path::PathBuf, time::Duration};
use tauri::{Manager, Window};
use tokio::time::sleep;

use crate::PocketSyncState;

pub fn check_if_folder_looks_like_pocket(path: &PathBuf) -> bool {
    let json_path = path.join("Analogue_Pocket.json");

    if !json_path.exists() {
        return false;
    }
    let assets_path = path.join("Assets");
    if !assets_path.exists() {
        return false;
    }
    let cores_path = path.join("Cores");
    if !cores_path.exists() {
        return false;
    }
    // yeah, looks enough like a Pocket
    return true;
}

pub async fn connection_task(window: Window) -> () {
    let state: tauri::State<PocketSyncState> = window.state();
    let main_window = window.clone();
    let mut was_connected: bool = false;

    loop {
        sleep(Duration::from_secs(1)).await;
        let pocket_path = &state.0.pocket_path.read().await;
        if !pocket_path.exists() && was_connected {
            was_connected = false;
            main_window
                .emit(
                    "pocket-connection",
                    ConnectionEventPayload { connected: false },
                )
                .unwrap();
        } else if pocket_path.exists() && !was_connected {
            was_connected = true;
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
struct ConnectionEventPayload {
    connected: bool,
}
