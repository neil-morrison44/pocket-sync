use notify::{RecursiveMode, Watcher};
use notify_debouncer_full::new_debouncer;
use serde::{Deserialize, Serialize};
use std::{path::PathBuf, time::Duration};
use tauri::Window;
use tokio::sync::mpsc;

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
    // let state: tauri::State<PocketSyncState> = window.state();
    let main_window = window.clone();

    let (tx, mut rx) = mpsc::channel(10);
    // let mut was_connected: bool = false;

    // setup debouncer
    // let (tx, rx) = std::sync::mpsc::channel();

    // no specific tickrate, max debounce time 2 seconds
    let mut debouncer = new_debouncer(Duration::from_millis(200), None, move |res| {
        tx.try_send(res).unwrap();
    })
    .unwrap();

    println!("Watching...");

    debouncer
        .watcher()
        .watch(&pocket_path, RecursiveMode::Recursive)
        .unwrap();

    debouncer
        .cache()
        .add_root(&pocket_path, RecursiveMode::Recursive);

    // print all events and errors
    // for result in rx {
    //     match result {
    //         Ok(events) => events.iter().for_each(|event| println!("{event:?}")),
    //         Err(errors) => errors.iter().for_each(|error| println!("{error:?}")),
    //     }
    //     println!();
    // }

    while let Some(res) = rx.recv().await {
        match res {
            Ok(events) => {
                println!("changed: {:?}", &events);
                main_window
                    .emit(
                        "pocket-fs-event",
                        events.into_iter().map(|e| e.event).collect::<Vec<_>>(),
                    )
                    .unwrap();
            }
            Err(e) => println!("watch error: {:?}", e),
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
