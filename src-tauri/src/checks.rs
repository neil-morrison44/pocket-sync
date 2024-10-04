use log::info;
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, time::Duration};
use tauri::{Emitter, WebviewWindow};

#[derive(Serialize, Deserialize, Clone)]
struct FSEventPayload {
    events: Vec<notify::Event>,
    pocket_path: String,
}

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

pub async fn connection_task(window: WebviewWindow, pocket_path: PathBuf) -> () {
    info!(
        "Watching files and folders at {}....",
        &pocket_path.display()
    );

    let main_window = window.clone();
    let pocket_path_string = String::from(pocket_path.to_string_lossy());
    let mut root_watcher = RecommendedWatcher::new(
        move |res| {
            if let Ok(event) = res {
                main_window
                    .emit(
                        "pocket-fs-event",
                        FSEventPayload {
                            events: vec![event],
                            pocket_path: pocket_path_string.clone(),
                        },
                    )
                    .unwrap();
            }
        },
        Config::default(),
    )
    .unwrap();

    root_watcher
        .watch(&pocket_path, RecursiveMode::Recursive)
        .unwrap();

    let polling_path = pocket_path.clone();
    let main_window = window.clone();

    loop {
        tokio::time::sleep(Duration::from_secs(1)).await;
        if !polling_path.exists() {
            main_window
                .emit(
                    "pocket-connection",
                    ConnectionEventPayload { connected: false },
                )
                .unwrap();
            break;
        }
    }

    println!("Exited?");
}

#[derive(Serialize, Deserialize, Clone)]
struct ConnectionEventPayload {
    connected: bool,
}
