use mister_saves_sync::{MiSTerSaveSync, SaveSyncer};
use serde::{Deserialize, Serialize};
use std::{error::Error, io::Read, path::PathBuf, sync::Arc};
use tauri::Window;
use tokio::io::AsyncWriteExt;
use tokio::{
    sync::{broadcast, mpsc},
    task,
};

#[derive(Clone, Serialize)]
struct PlainMessage(String);

#[derive(Clone, Serialize, Debug)]
struct MiSTerSaveInfo {
    path: Option<PathBuf>,
    timestamp: Option<u64>,
    pocket_save: PocketSaveInfo,
    crc32: u32,
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

#[derive(Debug, Clone)]
enum IncomingMessage {
    Find(PocketSaveInfo),
    PocketToMiSTer(Transfer),
    MiSTerToPocket(Transfer),
    HeartBeat,
}

#[derive(Debug, Clone)]
enum OutboundMessage {
    FoundSave(MiSTerSaveInfo),
    MovedSave(Transfer),
}

pub async fn start_mister_save_sync_session(
    host: &str,
    user: &str,
    password: &str,
    window: Window,
) -> Result<bool, Box<dyn Error>> {
    let (log_tx, mut log_rx) = tokio::sync::mpsc::channel(100);
    let (kill_tx, _kill_rx) = tokio::sync::broadcast::channel(1);

    let log_tx: Arc<_> = log_tx.into();
    let window: Arc<_> = window.into();

    let (host, user, password) = (
        String::from(host),
        String::from(user),
        String::from(password),
    );

    let mut mister_syncer = MiSTerSaveSync::new(&host, &user, &password);
    let connected = mister_syncer.connect(&log_tx).await.unwrap();

    {
        let window = window.clone();
        task::spawn(async move {
            while let Some(msg) = log_rx.recv().await {
                window
                    .emit("mister-save-sync-log", PlainMessage(msg))
                    .unwrap();
            }
        })
    };

    {
        let window = window.clone();
        let kill_tx = kill_tx.clone();
        task::spawn(async move {
            let (message_tx, mut message_rx) = tokio::sync::broadcast::channel(100);
            let message_tx: Arc<_> = message_tx.into();

            let (outbound_message_tx, mut outbound_message_rx) =
                tokio::sync::broadcast::channel(100);
            let outbound_message_tx: Arc<_> = outbound_message_tx.into();

            {
                task::spawn(async move {
                    while let Ok(msg) = message_rx.recv().await {
                        match msg {
                            IncomingMessage::Find(pocket_save_info) => {
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
                                let mut file = std::fs::File::open(&transfer.from).unwrap();

                                let mut buf = Vec::new();
                                file.by_ref().read_to_end(&mut buf).unwrap();

                                let cursor = std::io::Cursor::new(buf);
                                let boxed_cursor = Box::new(cursor);

                                match mister_syncer.write_save(&transfer.to, boxed_cursor).await {
                                    Ok(_) => {
                                        log_tx
                                            .send(format!(
                                                "Moved {:?} Pocket -> {:?} MiSTer",
                                                &transfer.from, &transfer.to
                                            ))
                                            .await
                                            .unwrap();
                                        outbound_message_tx
                                            .send(OutboundMessage::MovedSave(transfer))
                                            .unwrap();
                                    }
                                    Err(err) => {
                                        log_tx
                                            .send(format!("Error: {}", err.to_string()))
                                            .await
                                            .unwrap();
                                    }
                                }
                            }
                            IncomingMessage::MiSTerToPocket(transfer) => {
                                match mister_syncer.read_save(&transfer.from).await {
                                    Ok(mut mister_file) => {
                                        let mut buf = Vec::new();
                                        mister_file.read_to_end(&mut buf).unwrap();

                                        match tokio::fs::write(&transfer.to, buf).await {
                                            Ok(_) => {
                                                log_tx
                                                    .send(format!(
                                                        "Moved {:?} MiSTer -> {:?} Pocket",
                                                        &transfer.from, &transfer.to
                                                    ))
                                                    .await
                                                    .unwrap();
                                                outbound_message_tx
                                                    .send(OutboundMessage::MovedSave(transfer))
                                                    .unwrap();
                                            }
                                            Err(err) => {
                                                log_tx
                                                    .send(format!("Error: {}", err.to_string()))
                                                    .await
                                                    .unwrap();
                                            }
                                        }
                                    }
                                    Err(err) => {
                                        log_tx
                                            .send(format!("Error: {}", err.to_string()))
                                            .await
                                            .unwrap();
                                    }
                                }
                            }
                            IncomingMessage::HeartBeat => {
                                mister_syncer.heartbeat().await;
                            }
                        }
                    }
                });
            }

            {
                let window = window.clone();
                let mut kill_rx = kill_tx.subscribe();
                task::spawn(async move {
                    loop {
                        tokio::select! {
                          _ = kill_rx.recv() => {
                            println!("killing OutboundMessage sender");
                            break;
                          }
                          msg = outbound_message_rx.recv() => {
                            match msg {
                                Ok(msg) => {
                                    match msg {
                                        OutboundMessage::FoundSave(mister_save_info) => {

                                            window
                                                .emit("mister-save-sync-found-save", mister_save_info)
                                                .unwrap();
                                        },
                                        OutboundMessage::MovedSave(transfer) => {
                                            window
                                            .emit("mister-save-sync-moved-save", transfer)
                                            .unwrap();
                                        }
                                      }
                                },
                                Err(_) => {
                                    break;
                                }
                            }
                          }
                        }
                    }
                });
            }

            let find_save_listener = {
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
                                    .send(IncomingMessage::Find(pocket_save_info))
                                    .unwrap();
                            });
                        }
                    }
                })
            };

            let save_to_pocket_listener = {
                let message_tx = message_tx.clone();
                let window = window.clone();
                window.listen("mister-save-sync-move-save-to-pocket", move |event| {
                    if let Some(payload) = event.payload() {
                        let transfer_info: Transfer = serde_json::from_str(payload).unwrap();
                        {
                            let message_tx = message_tx.clone();
                            std::thread::spawn(move || {
                                message_tx
                                    .send(IncomingMessage::MiSTerToPocket(transfer_info))
                                    .unwrap();
                            });
                        }
                    }
                })
            };
            let save_to_mister_listener = {
                let message_tx = message_tx.clone();
                let window = window.clone();
                window.listen("mister-save-sync-move-save-to-mister", move |event| {
                    if let Some(payload) = event.payload() {
                        let transfer_info: Transfer = serde_json::from_str(payload).unwrap();
                        message_tx
                            .send(IncomingMessage::PocketToMiSTer(transfer_info))
                            .unwrap();
                    }
                })
            };

            let heartbeat_listener = {
                let message_tx = message_tx.clone();
                let window = window.clone();
                window.listen("mister-save-sync-heartbeat", move |_| {
                    message_tx.send(IncomingMessage::HeartBeat).unwrap();
                })
            };

            {
                let mut kill_rx = kill_tx.subscribe();
                task::spawn(async move {
                    let _ = kill_rx.recv().await;
                    window.unlisten(find_save_listener);
                    window.unlisten(save_to_pocket_listener);
                    window.unlisten(save_to_mister_listener);
                    window.unlisten(heartbeat_listener);
                })
            }
        })
    };

    {
        let window = window.clone();
        let kill_tx = kill_tx.clone();
        window.once("mister-save-sync-end", move |_| {
            kill_tx.send(()).unwrap();
        });
    }

    return Ok(connected);
}

async fn find_mister_save(
    outbound_channel: &broadcast::Sender<OutboundMessage>,
    mister_syncer: &MiSTerSaveSync,
    pocket_save_info: &PocketSaveInfo,
    log_tx: &mpsc::Sender<String>,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    if let Ok(Some(found_save_path)) = mister_syncer
        .find_save_for(&pocket_save_info.platform, &pocket_save_info.file, log_tx)
        .await
    {
        let timestamp = mister_syncer.read_timestamp(&found_save_path).await?;
        let file = mister_syncer.read_save(&found_save_path).await?;
        let crc32 = mister_save_crc32(file);

        outbound_channel.send(OutboundMessage::FoundSave(MiSTerSaveInfo {
            path: Some(found_save_path),
            timestamp: Some(timestamp),
            pocket_save: pocket_save_info.clone(),
            crc32,
        }))?;
    }
    Ok(())
}

fn mister_save_crc32(mut file: Box<dyn std::io::Read>) -> u32 {
    // this should probably be more async
    // the file should be fully in memory at this point though so it should be fine
    let mut buffer: Vec<u8> = Vec::new();
    file.read_to_end(&mut buffer).unwrap();
    let checksum = crc32fast::hash(&buffer);
    checksum
}
