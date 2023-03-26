use futures::future::join;
use mister_saves_sync::{MiSTerSaveSync, SaveSyncer};
use serde::{Deserialize, Serialize};
use std::{error::Error, path::PathBuf, sync::Arc, thread};
use tauri::{Event, Window};
use tokio::{sync::mpsc, task};

#[derive(Clone, Serialize)]
struct PlainMessage(String);

#[derive(Clone, Serialize, Debug)]
struct MiSTerSaveInfo {
    path: Option<PathBuf>,
    timestamp: Option<u64>,
    equal: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
struct PocketSaveInfo {
    file: String,
    platform: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
struct Transfer {
    to: PathBuf,
    from: PathBuf,
}

#[derive(Debug)]
enum IncomingMessage {
    Find(PocketSaveInfo),
    PocketToMiSTer(Transfer),
    MiSTerToPocket(Transfer),
}

#[derive(Debug)]
enum OutboundMessage {
    FoundSave(MiSTerSaveInfo),
}

pub async fn start_mister_save_sync_session(
    host: &str,
    user: &str,
    password: &str,
    window: Window,
) -> Result<bool, Box<dyn Error>> {
    let (log_tx, mut log_rx) = mpsc::channel(100);
    let log_tx: Arc<_> = log_tx.into();
    let window: Arc<_> = window.into();

    let (host, user, password) = (
        String::from(host),
        String::from(user),
        String::from(password),
    );

    let mut mister_syncer = MiSTerSaveSync::new(&host, &user, &password);
    let connected = mister_syncer.connect(&log_tx).await.unwrap();

    let log_receiver_task = {
        let window = window.clone();
        task::spawn(async move {
            while let Some(msg) = log_rx.recv().await {
                window
                    .emit("mister-save-sync-log", PlainMessage(msg))
                    .unwrap();
            }
        })
    };

    let processing_task = {
        let window = window.clone();
        task::spawn(async move {
            println!("mister_syncer");

            dbg!(connected);

            let (message_tx, mut message_rx) = mpsc::channel(100);
            let message_tx: Arc<_> = message_tx.into();

            let (outbound_message_tx, mut outbound_message_rx) = mpsc::channel(100);
            let outbound_message_tx: Arc<_> = outbound_message_tx.into();

            task::spawn(async move {
                while let Some(msg) = message_rx.recv().await {
                    match msg {
                        IncomingMessage::Find(pocket_save_info) => {
                            println!("find mister save");
                            let result = find_mister_save(
                                &outbound_message_tx,
                                &mister_syncer,
                                &pocket_save_info,
                                &log_tx,
                            )
                            .await;

                            match result {
                                Ok(_) => {}
                                Err(err) => {
                                    log_tx
                                        .send(format!("Error: {}", err.to_string()))
                                        .await
                                        .unwrap();
                                }
                            }
                        }
                        IncomingMessage::PocketToMiSTer(transfer) => {
                            dbg!(transfer);
                        }
                        IncomingMessage::MiSTerToPocket(transfer) => {
                            dbg!(transfer);
                        }
                    }
                }
            });

            {
                let window = window.clone();
                task::spawn(async move {
                    println!("waiting on outbound messages");
                    while let Some(msg) = outbound_message_rx.recv().await {
                        match msg {
                            OutboundMessage::FoundSave(mister_save_info) => {
                                dbg!(&mister_save_info);
                                window
                                    .emit("mister-save-sync-found-save", mister_save_info)
                                    .unwrap();
                            }
                        }
                    }
                });
            }

            {
                let message_tx = message_tx.clone();
                let window = window.clone();
                window.listen("mister-save-sync-find-save", move |event| {
                    if let Some(payload) = event.payload() {
                        let pocket_save_info: PocketSaveInfo =
                            serde_json::from_str(payload).unwrap();
                        {
                            let message_tx = message_tx.clone();
                            std::thread::spawn(move || {
                                message_tx
                                    .blocking_send(IncomingMessage::Find(pocket_save_info))
                                    .unwrap();
                            });
                        }
                    }
                });
            }
            {
                let message_tx = message_tx.clone();
                let window = window.clone();
                window.listen("mister-save-sync-move-save-to-pocket", move |event| {
                    if let Some(payload) = event.payload() {
                        let transfer_info: Transfer = serde_json::from_str(payload).unwrap();
                        {
                            let message_tx = message_tx.clone();
                            std::thread::spawn(move || {
                                message_tx
                                    .blocking_send(IncomingMessage::MiSTerToPocket(transfer_info))
                                    .unwrap();
                            });
                        }
                    }
                });
            }
            {
                let message_tx = message_tx.clone();
                let window = window.clone();
                window.listen("mister-save-sync-move-save-to-mister", move |event| {
                    if let Some(payload) = event.payload() {
                        let transfer_info: Transfer = serde_json::from_str(payload).unwrap();
                        message_tx
                            .blocking_send(IncomingMessage::PocketToMiSTer(transfer_info))
                            .unwrap();
                    }
                });
            }
        })
    };

    tauri::async_runtime::spawn(join(log_receiver_task, processing_task));

    return Ok(connected);
}

async fn find_mister_save(
    outbound_channel: &mpsc::Sender<OutboundMessage>,
    mister_syncer: &MiSTerSaveSync,
    pocket_save_info: &PocketSaveInfo,
    log_tx: &mpsc::Sender<String>,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    if let Ok(Some(found_save_path)) = mister_syncer
        .find_save_for(&pocket_save_info.platform, &pocket_save_info.file, log_tx)
        .await
    {
        dbg!(&found_save_path);

        let timestamp = mister_syncer.read_timestamp(&found_save_path).await?;

        outbound_channel
            .send(OutboundMessage::FoundSave(MiSTerSaveInfo {
                path: Some(found_save_path),
                timestamp: Some(timestamp),
                equal: false,
            }))
            .await?;
    }
    Ok(())
}
