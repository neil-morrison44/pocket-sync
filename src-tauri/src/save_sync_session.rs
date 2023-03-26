use mister_saves_sync::{MiSTerSaveSync, SaveSyncer};
use serde::Serialize;
use std::{error::Error, sync::Arc};
use tauri::Window;
use tokio::{sync::mpsc, task};

#[derive(Clone, Serialize)]
struct PlainMessage(String);

pub async fn start_mister_save_sync_session(window: Window) -> Result<(), Box<dyn Error>> {
    let (tx, mut rx) = mpsc::channel(100);
    let window: Arc<_> = window.into();

    {
        let window = window.clone();
        let receiver_task = task::spawn(async move {
            while let Some(msg) = rx.recv().await {
                // Do something with the received message
                println!("Received message: {}", msg);

                window.emit("mister-save-sync-log", PlainMessage(msg))?;
            }
        });
    }
    {
        let window = window.clone();
        task::spawn(async move {
            let mut mister_syncer = MiSTerSaveSync::new("host", "user", "password");

            let connected = mister_syncer.connect(tx).await.unwrap();

            window.emit("hello", {});
            window.emit("hello", {});
        });
    }
    return Ok(());
}
