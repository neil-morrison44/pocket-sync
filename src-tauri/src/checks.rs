use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use notify_debouncer_full::{new_debouncer, DebouncedEvent};
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, time::Duration};
use tauri::Window;
use tokio::sync::mpsc;

#[derive(Serialize, Deserialize, Clone)]
struct FSEventPayload {
    events: Vec<notify::Event>,
    pocket_path: String,
}

enum DebouncedOrRoot {
    Root(Result<Event, notify::Error>),
    Debounced(Result<Vec<DebouncedEvent>, Vec<notify::Error>>),
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
    println!("Watching...");

    let root_tx = tx.clone();
    let mut debouncer = new_debouncer(Duration::from_millis(550), None, move |res| {
        root_tx.try_send(DebouncedOrRoot::Debounced(res)).unwrap();
    })
    .unwrap();

    debouncer
        .watcher()
        .watch(&pocket_path, RecursiveMode::Recursive)
        .unwrap();

    debouncer
        .cache()
        .add_root(&pocket_path, RecursiveMode::Recursive);

    let files_tx = tx.clone();
    let mut root_watcher = RecommendedWatcher::new(
        move |res| {
            files_tx.try_send(DebouncedOrRoot::Root(res)).unwrap();
        },
        Config::default(),
    )
    .unwrap();

    root_watcher
        .watch(&pocket_path, RecursiveMode::NonRecursive)
        .unwrap();

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
                            pocket_path: String::from(pocket_path.to_str().unwrap()),
                        },
                    )
                    .unwrap();
            }
            DebouncedOrRoot::Debounced(Err(e)) => println!("watch error: {:?}", e),
            DebouncedOrRoot::Root(Ok(r)) if r.kind.is_remove() => {
                main_window
                    .emit(
                        "pocket-connection",
                        ConnectionEventPayload { connected: false },
                    )
                    .unwrap();
                break;
            }
            DebouncedOrRoot::Root(Ok(_)) | DebouncedOrRoot::Root(Err(_)) => {}
        }
    }

    println!("Exited?");

    // loop {
    //     sleep(Duration::from_secs(1)).await;
    //     let pocket_path = &state.0.pocket_path.read().await;
    //     if !pocket_path.exists() && was_connected {
    //         was_connected = false;
    //         main_window
    //             .emit(
    //                 "pocket-connection",
    //                 ConnectionEventPayload { connected: false },
    //             )
    //             .unwrap();
    //     } else if pocket_path.exists() && !was_connected {
    //         was_connected = true;
    //     }
    // }
}

#[derive(Serialize, Deserialize, Clone)]
struct ConnectionEventPayload {
    connected: bool,
}
