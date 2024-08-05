use futures::StreamExt;
use log::info;
use nestify::nest;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::Cursor,
    path::{Path, PathBuf},
    time::Duration,
};
use tauri::{Listener, Manager, WebviewWindow};
use tempdir::TempDir;
use walkdir::WalkDir;
use zip::ZipArchive;

mod payloads;

use crate::{
    core_json_files::{
        core::CoreFile,
        updaters::{CoreUpdateDetails, UpdatersFile},
    },
    util::progress_download,
    PocketSyncState,
};
struct Titles {
    title: String,
    installing_title: String,
}
nest! {
#[derive(Debug, Serialize, Deserialize)]*
enum ZipStartAction {
    FileDrop(Vec<PathBuf>),
    InstallCore(struct InstallInfo {
        core_name: String,
        zip_url: String,
    }),
}
}
use tauri::DragDropEvent::Drop;
use tauri::WindowEvent::DragDrop;

use self::payloads::{FromRustPayload, FromTSPayload, PathStatus, ZipInstallProgress};

pub async fn start_zip_task(window: WebviewWindow) -> () {
    info!("Zip Task Started");
    // Just incase it's a timing issue with the install failing thing
    tokio::time::sleep(Duration::from_millis(200)).await;
    let state: tauri::State<PocketSyncState> = window.state();
    let (zip_start_tx, mut zip_start_rx) = tokio::sync::mpsc::channel(32);

    let main_window = window.clone();
    {
        let tx = zip_start_tx.clone();
        main_window.on_window_event(move |event| {
            if let DragDrop(Drop { paths, position: _ }) = event {
                if paths.len() != 0 {
                    tx.try_send(ZipStartAction::FileDrop(paths.clone()))
                        .unwrap();
                }
            }
        });
        info!("Zip Task listening for file drop");
    }
    {
        let tx = zip_start_tx.clone();
        main_window.listen("install-core", move |event| {
            info!("Installing Core Event");
            let install: InstallInfo = serde_json::from_str(event.payload()).unwrap();
            info!("Core - {}", &install.core_name);
            tx.try_send(ZipStartAction::InstallCore(install)).unwrap();
        });
        info!("Zip Task listening for install-core");
    }

    loop {
        match zip_start_rx.recv().await {
            Some(ZipStartAction::FileDrop(paths)) => {
                let pocket_path = state.0.pocket_path.read().await;
                if !pocket_path.exists() || paths.len() != 1 {
                    break;
                }

                for path in paths {
                    if !path
                        .file_name()
                        .and_then(|f| f.to_str())
                        .unwrap()
                        .ends_with(".zip")
                    {
                        continue;
                    }
                    let zip_file = fs::read(&path).unwrap();
                    let cursor = Cursor::new(zip_file);
                    let archive = zip::ZipArchive::new(cursor).unwrap();

                    start_zip_install_flow(
                        archive,
                        Titles {
                            title: String::from(format!(
                                "Installing {}",
                                &path.file_name().and_then(|f| f.to_str()).unwrap()
                            )),
                            installing_title: (String::from("Installing Zip...")),
                        },
                        pocket_path.clone(),
                        &window,
                    )
                    .await
                    .unwrap();
                }
            }
            Some(ZipStartAction::InstallCore(install)) => {
                let pocket_path = state.0.pocket_path.read().await;
                let response = reqwest::get(&install.zip_url).await.unwrap();
                match response.status() {
                    StatusCode::OK => {
                        let zip_file = progress_download(response, |total_size, downloaded| {
                            FromRustPayload::DownloadProgress {
                                url: install.zip_url.clone(),
                                downloaded,
                                total_size,
                            }
                            .emit(&main_window)
                            .unwrap();
                        })
                        .await
                        .unwrap();

                        let cursor = Cursor::new(zip_file);
                        let archive = zip::ZipArchive::new(cursor).unwrap();

                        match start_zip_install_flow(
                            archive,
                            Titles {
                                title: String::from("Install Core"),
                                installing_title: (String::from("Installing Core...")),
                            },
                            pocket_path.clone(),
                            &window,
                        )
                        .await
                        {
                            Ok(_) => (),
                            Err(e) => {
                                FromRustPayload::ZipInstallFinished {
                                    error: Some(format!("Unable to install core:\n{}", e)),
                                }
                                .emit(&main_window)
                                .unwrap();
                            }
                        }
                    }
                    status => {
                        FromRustPayload::ZipInstallFinished {
                            error: Some(format!("Unable to download ZIP:\n{}", status)),
                        }
                        .emit(&main_window)
                        .unwrap();
                    }
                }
            }
            None => break,
        }
    }
}

async fn process_core_replacements(
    window: &WebviewWindow,
    pocket_path: &PathBuf,
    new_core: &CoreUpdateDetails,
    previous_cores: &Vec<CoreUpdateDetails>,
) -> () {
    let installed_previous_cores: Vec<_> = previous_cores
        .iter()
        .filter(|previous_core| {
            let core_json_path = pocket_path.join(format!(
                "Cores/{}.{}/core.json",
                previous_core.author, previous_core.shortname
            ));

            return core_json_path.exists();
        })
        .collect();

    if installed_previous_cores.len() == 0 {
        return ();
    }
    let confirm_event = FromRustPayload::ReplaceConfirmEvent {
        previous_core_names: previous_cores
            .iter()
            .map(|d| format!("{}.{}", d.author, d.shortname))
            .collect(),
    };
    let replace_confirm = confirm_event.wait_for_confirmation(&window).await.unwrap();

    let allow = match replace_confirm {
        payloads::FromTSPayload::ReplaceConfirmation { allow } => allow,
        _ => panic!("Wrong replace_confirm payload"),
    };

    if !allow {
        return ();
    }

    for previous_core in installed_previous_cores {
        FromRustPayload::InstallZipEvent {
            title: format!(
                "Replacing core {}.{}",
                previous_core.author, previous_core.shortname
            )
            .into(),
            files: None,
            progress: Some(ZipInstallProgress { value: 1, max: 100 }),
        }
        .emit(&window)
        .unwrap();

        move_files(
            pocket_path.join(format!(
                "Assets/{}/{}.{}",
                previous_core.platform_id, previous_core.author, previous_core.shortname
            )),
            pocket_path.join(format!(
                "Assets/{}/{}.{}",
                new_core.platform_id, new_core.author, new_core.shortname
            )),
        )
        .await
        .unwrap();

        move_files(
            pocket_path.join(format!("Assets/{}/common", previous_core.platform_id)),
            pocket_path.join(format!("Assets/{}/common", new_core.platform_id)),
        )
        .await
        .unwrap();

        move_files(
            pocket_path.join(format!(
                "Saves/{}/{}.{}",
                previous_core.platform_id, previous_core.author, previous_core.shortname
            )),
            pocket_path.join(format!(
                "Saves/{}/{}.{}",
                new_core.platform_id, new_core.author, new_core.shortname
            )),
        )
        .await
        .unwrap();

        move_files(
            pocket_path.join(format!("Saves/{}/common", previous_core.platform_id)),
            pocket_path.join(format!("Saves/{}/common", new_core.platform_id)),
        )
        .await
        .unwrap();

        move_files(
            pocket_path.join(format!(
                "Settings/{}.{}",
                previous_core.author, previous_core.shortname
            )),
            pocket_path.join(format!(
                "Settings/{}.{}",
                new_core.author, new_core.shortname
            )),
        )
        .await
        .unwrap();

        tokio::fs::remove_dir_all(pocket_path.join(format!(
            "Cores/{}.{}",
            previous_core.author, previous_core.shortname
        )))
        .await
        .unwrap();
    }

    // Could also do save states & screenshots here
}

async fn move_files(
    origin_folder: PathBuf,
    dest_folder: PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    if origin_folder == dest_folder || !origin_folder.exists() {
        return Ok(());
    }

    let mut walker = async_walkdir::WalkDir::new(&origin_folder);
    let mut found_files = Vec::new();

    while let Some(Ok(entry)) = walker.next().await {
        match entry.file_type().await {
            Ok(f) => {
                if f.is_file() {
                    let path = entry.path();
                    found_files.push(path);
                }
            }
            Err(_) => continue,
        }
    }

    let file_moves: Vec<_> = found_files
        .into_iter()
        .map(|p| {
            let dest_path = dest_folder.join(p.strip_prefix(&origin_folder).unwrap());
            (p, dest_path)
        })
        .collect();

    for file_move in file_moves {
        let (from, to) = file_move;
        tokio::fs::create_dir_all(to.parent().unwrap())
            .await
            .unwrap();
        tokio::fs::copy(&from, &to).await.unwrap();
        tokio::fs::remove_file(&from).await.unwrap();
    }

    Ok(())
}

async fn start_zip_install_flow(
    mut archive: ZipArchive<impl std::io::Read + std::io::Seek + std::marker::Send + 'static>,
    titles: Titles,
    pocket_path: PathBuf,
    window: &WebviewWindow,
) -> Result<(), Box<dyn std::error::Error>> {
    let state: tauri::State<PocketSyncState> = window.state();

    let file_locks = state.0.file_locker.find_lock_for(&pocket_path).await;
    let _write_lock = file_locks.write().await;

    let zip_confirm_event = FromRustPayload::InstallZipEvent {
        title: String::from(&titles.title),
        files: Some(get_file_names(&archive, &pocket_path)),
        progress: None,
    };

    let main_window = window.clone();
    let install_confirm = zip_confirm_event.wait_for_confirmation(&window).await?;

    let (paths, handle_moved_files, allow) = match install_confirm {
        FromTSPayload::InstallConfirmation {
            paths,
            handle_moved_files,
            allow,
        } => (paths, handle_moved_files, allow),
        _ => panic!("Wrong install_confirm type"),
    };

    if !allow {
        FromRustPayload::ZipInstallFinished { error: None }.emit(&main_window)?;
        return Ok(());
    }

    FromRustPayload::InstallZipEvent {
        title: titles.installing_title.clone(),
        files: None,
        progress: Some(ZipInstallProgress {
            value: 0,
            max: paths.len(),
        }),
    }
    .emit(&window)?;

    let tmp_dir = TempDir::new("zip_install_tmp")?;
    let tmp_path = tmp_dir.into_path();
    archive.extract(&tmp_path)?;

    if handle_moved_files || true {
        for path in paths.iter() {
            let destination = pocket_path.join(&path);
            let source = tmp_path.join(&path);

            if !source.is_file() {
                continue;
            }

            let file_name = path.file_name();
            let root = destination.ancestors().find(|p| {
                matches!(
                    p.parent()
                        .and_then(|par| par.file_name())
                        .and_then(|f| f.to_str()),
                    Some("Assets" | "Cores" | "Input" | "Interact")
                )
            });

            if let (Some(root), Some(file_name)) = (root, file_name.and_then(|f| f.to_str())) {
                let matching_files = find_matching_files(root, file_name);
                for file in matching_files {
                    if file != destination {
                        if let Err(err) = tokio::fs::remove_file(file).await {
                            println!("File Moving error {}", err);
                        }
                    }
                }
            }
        }
    }

    for (index, path) in paths.iter().enumerate() {
        let destination = pocket_path.join(&path);
        let source = tmp_path.join(&path);

        if destination.is_dir() && destination.exists() {
            continue;
        }

        tokio::fs::create_dir_all(destination.parent().unwrap()).await?;
        if !source.is_dir() {
            tokio::fs::copy(&source, &destination).await?;
        }

        FromRustPayload::InstallZipEvent {
            title: titles.installing_title.clone(),
            files: None,
            progress: Some(ZipInstallProgress {
                value: index + 1,
                max: paths.len(),
            }),
        }
        .emit(&main_window)?;
    }

    // check if there's an updaters.json file in the installed cores

    let cores: Vec<_> = paths
        .iter()
        .filter(|path| path.ends_with("core.json"))
        .map(|p| p.parent().unwrap())
        .collect();

    for core_path in cores {
        let full_core_path = pocket_path.join(core_path);
        if let Some(updaters_file) = UpdatersFile::from_core_path(&full_core_path) {
            if let Some(previous) = updaters_file.previous {
                let new_core = CoreFile::from_core_path(&full_core_path).unwrap();
                process_core_replacements(&window, &pocket_path, &new_core.into(), &previous).await;
            }
        }
    }

    FromRustPayload::ZipInstallFinished { error: None }.emit(&main_window)?;

    Ok(())
}

fn get_file_names(
    zip: &ZipArchive<impl std::io::Read + std::io::Seek>,
    pocket_path: &PathBuf,
) -> Vec<PathStatus> {
    let files = zip.file_names();
    files
        .into_iter()
        .map(|f| {
            let path = pocket_path.join(f);
            PathStatus {
                exists: path.exists(),
                path: String::from(f),
            }
        })
        .collect()
}

fn find_matching_files(root_path: &Path, file_name: &str) -> Vec<PathBuf> {
    WalkDir::new(root_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|entry| entry.file_name().to_str() == Some(file_name))
        .map(|entry| entry.into_path())
        .collect()
}
