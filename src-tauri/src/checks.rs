use log::info;
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use notify_debouncer_full::{new_debouncer, DebouncedEvent};
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, time::Duration};
use tauri::Window;
use tokio::sync::mpsc;

use crate::result_logger::{OptionLogger, ResultLogger};

#[derive(Serialize, Deserialize, Clone)]
struct FSEventPayload {
    events: Vec<notify::Event>,
    pocket_path: String,
}

enum DebouncedOrRoot {
    Root(Result<Event, notify::Error>),
    Debounced(Result<Vec<DebouncedEvent>, Vec<notify::Error>>),
    PolledDisconnect,
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

pub async fn connection_task(window: Window, pocket_path: PathBuf) -> () {
    let (tx, mut rx) = mpsc::channel(10);
    info!(
        "Watching files and folders at {}....",
        &pocket_path.display()
    );

    let root_tx = tx.clone();
    let mut debouncer = new_debouncer(Duration::from_millis(100), None, move |res| {
        root_tx
            .try_send(DebouncedOrRoot::Debounced(res))
            .unwrap_and_log();
    })
    .unwrap_and_log();

    debouncer
        .watcher()
        .watch(&pocket_path, RecursiveMode::Recursive)
        .unwrap_and_log();

    // This causes a deadlock on Windows for some reason
    // debouncer
    //     .cache()
    //     .add_root(&pocket_path, RecursiveMode::Recursive);

    let files_tx = tx.clone();
    let mut root_watcher = RecommendedWatcher::new(
        move |res| {
            files_tx
                .try_send(DebouncedOrRoot::Root(res))
                .unwrap_and_log();
        },
        Config::default(),
    )
    .unwrap_and_log();

    root_watcher
        .watch(&pocket_path, RecursiveMode::NonRecursive)
        .unwrap_and_log();

    let poll_tx = tx.clone();
    let polling_path = pocket_path.clone();
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(1)).await;
            if !polling_path.exists() {
                poll_tx
                    .send(DebouncedOrRoot::PolledDisconnect)
                    .await
                    .unwrap_and_log();
                break;
            }
        }
    });

    let main_window = window.clone();
    while let Some(res) = rx.recv().await {
        match res {
            DebouncedOrRoot::Debounced(Ok(events)) => {
                // println!("changed: {:?}", &events);
                main_window
                    .emit(
                        "pocket-fs-event",
                        FSEventPayload {
                            events: events.into_iter().map(|e| e.event).collect::<Vec<_>>(),
                            pocket_path: String::from(pocket_path.to_str().unwrap_and_log()),
                        },
                    )
                    .unwrap_and_log();
            }
            DebouncedOrRoot::Debounced(Err(e)) => println!("watch error: {:?}", e),
            DebouncedOrRoot::Root(Ok(r)) if r.kind.is_remove() => {
                main_window
                    .emit(
                        "pocket-connection",
                        ConnectionEventPayload { connected: false },
                    )
                    .unwrap_and_log();
                break;
            }
            DebouncedOrRoot::Root(Ok(_)) | DebouncedOrRoot::Root(Err(_)) => {}
            DebouncedOrRoot::PolledDisconnect => {
                main_window
                    .emit(
                        "pocket-connection",
                        ConnectionEventPayload { connected: false },
                    )
                    .unwrap_and_log();
                break;
            }
        }
    }

    println!("Exited?");
}

#[derive(Serialize, Deserialize, Clone)]
struct ConnectionEventPayload {
    connected: bool,
}
