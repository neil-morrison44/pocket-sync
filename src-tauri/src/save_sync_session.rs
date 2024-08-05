use mister_saves_sync::{FoundSave, MiSTerSaveSync, SaveSyncer};
use serde::{Deserialize, Serialize};
use std::{error::Error, io::Read, path::PathBuf, sync::Arc};
use tauri::Emitter;
use tauri::Listener;
use tauri::WebviewWindow;
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
    crc32: Option<u32>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
struct PocketSaveInfo {
    file: String,
    platforms: Vec<String>,
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
    ListPlatformsOnMiSTer,
    HeartBeat,
}

#[derive(Debug, Clone)]
enum OutboundMessage {
    FoundSave(MiSTerSaveInfo),
    PlatformList(Vec<String>),
    MovedSave(Transfer),
}

pub async fn start_mister_save_sync_session(
    host: &str,
    user: &str,
    password: &str,
    window: WebviewWindow,
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
                            IncomingMessage::ListPlatformsOnMiSTer => {
                                let platforms = &mister_syncer.list_platforms().await.unwrap();

                                outbound_message_tx
                                    .send(OutboundMessage::PlatformList(platforms.clone()))
                                    .unwrap();
                            }
                            IncomingMessage::Find(pocket_save_info) => {
                                let result = find_mister_save(
                                    &outbound_message_tx,
                                    &mister_syncer,
                                    &pocket_save_info,
                                    &log_tx,
                                )
                                .await;
                                if let Err(err) = result {
                                    log_tx.send(format!("Error: {}", err)).await.unwrap();
                                }
                            }
                            IncomingMessage::PocketToMiSTer(transfer) => {
                                let buf = tokio::fs::read(&transfer.from).await.unwrap();
                                if let Err(err) = mister_syncer
                                    .write_save(&transfer.to, Box::new(std::io::Cursor::new(buf)))
                                    .await
                                {
                                    log_tx.send(format!("Error: {}", err)).await.unwrap();
                                } else {
                                    log_tx
                                        .send(format!(
                                            "Copied {:?} Pocket -> {:?} MiSTer",
                                            &transfer.from, &transfer.to
                                        ))
                                        .await
                                        .unwrap();
                                    outbound_message_tx
                                        .send(OutboundMessage::MovedSave(transfer))
                                        .unwrap();
                                }
                            }
                            IncomingMessage::MiSTerToPocket(transfer) => {
                                match mister_syncer.read_save(&transfer.from).await {
                                    Ok(mut mister_file) => {
                                        let mut buf = Vec::new();
                                        mister_file.read_to_end(&mut buf).unwrap();
                                        if let Err(err) = tokio::fs::write(&transfer.to, buf).await
                                        {
                                            log_tx.send(format!("Error: {}", err)).await.unwrap();
                                        } else {
                                            log_tx
                                                .send(format!(
                                                    "Copied {:?} MiSTer -> {:?} Pocket",
                                                    &transfer.from, &transfer.to
                                                ))
                                                .await
                                                .unwrap();
                                            outbound_message_tx
                                                .send(OutboundMessage::MovedSave(transfer))
                                                .unwrap();
                                        }
                                    }
                                    Err(err) => {
                                        log_tx.send(format!("Error: {}", err)).await.unwrap();
                                    }
                                }
                            }
                            IncomingMessage::HeartBeat => match mister_syncer.heartbeat().await {
                                Err(err) => {
                                    log_tx.send(format!("Error: {}", err)).await.unwrap();
                                }
                                _ => {}
                            },
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
                          _ = kill_rx.recv() => { break; }
                          msg = outbound_message_rx.recv() => {
                            match msg {
                                Ok(OutboundMessage::PlatformList(platform_list)) => {
                                    window.emit("mister-save-sync-platform-list", platform_list).unwrap();
                                },
                                Ok(OutboundMessage::FoundSave(mister_save_info)) => {
                                    println!("Emmiting save");
                                    window.emit("mister-save-sync-found-save", mister_save_info).unwrap();
                                },
                                Ok(OutboundMessage::MovedSave(transfer)) => {
                                            window
                                            .emit("mister-save-sync-moved-save", transfer)
                                            .unwrap();
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
                    let payload = event.payload();
                    let pocket_save_info: PocketSaveInfo = serde_json::from_str(payload).unwrap();
                    message_tx
                        .send(IncomingMessage::Find(pocket_save_info))
                        .unwrap();
                })
            };

            let save_to_pocket_listener = {
                let message_tx = message_tx.clone();
                let window = window.clone();
                window.listen("mister-save-sync-move-save-to-pocket", move |event| {
                    let payload = event.payload();
                    let transfer_info: Transfer = serde_json::from_str(payload).unwrap();
                    message_tx
                        .send(IncomingMessage::MiSTerToPocket(transfer_info))
                        .unwrap();
                })
            };
            let save_to_mister_listener = {
                let message_tx = message_tx.clone();
                let window = window.clone();
                window.listen("mister-save-sync-move-save-to-mister", move |event| {
                    let payload = event.payload();
                    let transfer_info: Transfer = serde_json::from_str(payload).unwrap();
                    message_tx
                        .send(IncomingMessage::PocketToMiSTer(transfer_info))
                        .unwrap();
                })
            };

            let heartbeat_listener = {
                let message_tx = message_tx.clone();
                let window = window.clone();
                window.listen("mister-save-sync-heartbeat", move |_| {
                    message_tx.send(IncomingMessage::HeartBeat).unwrap();
                })
            };

            let platform_list_listener = {
                let message_tx = message_tx.clone();
                let window = window.clone();
                window.listen("mister-save-sync-list-platforms", move |_| {
                    message_tx
                        .send(IncomingMessage::ListPlatformsOnMiSTer)
                        .unwrap();
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
                    window.unlisten(platform_list_listener);
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
    match mister_syncer
        .find_save_for(&pocket_save_info.platforms, &pocket_save_info.file, log_tx)
        .await
    {
        Err(err) => {
            log_tx
                .send(format!("Error: {}", err.to_string()))
                .await
                .unwrap();
        }
        Ok(FoundSave::Found(found_save_path)) => {
            let timestamp = mister_syncer.read_timestamp(&found_save_path).await?;
            let file = mister_syncer.read_save(&found_save_path).await?;
            let crc32 = mister_save_crc32(file);

            outbound_channel.send(OutboundMessage::FoundSave(MiSTerSaveInfo {
                path: Some(found_save_path),
                timestamp: Some(timestamp),
                pocket_save: pocket_save_info.clone(),
                crc32: Some(crc32),
            }))?;
        }
        Ok(FoundSave::NotFound) => {
            println!("Save not found");
            outbound_channel.send(OutboundMessage::FoundSave(MiSTerSaveInfo {
                path: None,
                timestamp: None,
                pocket_save: pocket_save_info.clone(),
                crc32: None,
            }))?;
        }
        Ok(FoundSave::NotSupported) => {
            outbound_channel.send(OutboundMessage::FoundSave(MiSTerSaveInfo {
                path: None,
                timestamp: None,
                pocket_save: pocket_save_info.clone(),
                crc32: None,
            }))?;
        }
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
