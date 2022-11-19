use std::{
    path::PathBuf,
    thread::{self, sleep},
    time::Duration,
};

use serde::{Deserialize, Serialize};
use tauri::{App, Manager};

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

pub fn start_connection_thread(app: &App) -> Result<(), Box<(dyn std::error::Error + 'static)>> {
    let app_handle = app.handle();

    thread::spawn(move || {
        println!("thread started?");
        let main_window = app_handle.get_window("main").unwrap();
        let mut was_connected: bool = false;
        loop {
            tauri::async_runtime::block_on(async {
                let state: tauri::State<PocketSyncState> = tauri::Manager::state(&app_handle);
                let pocket_path = state.0.read().await;
                // println!("checking if still connected {}", pocket_path.exists());
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
            });

            sleep(Duration::from_secs(5));
        }
    });

    Ok(())
}

#[derive(Serialize, Deserialize, Clone)]
struct ConnectionEventPayload {
    connected: bool,
}
