use futures::stream::Zip;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::{Bytes, Cursor},
    path::PathBuf,
    thread,
};
use tauri::{App, Manager, Window};
use tempdir::TempDir;
use zip::ZipArchive;

use crate::PocketSyncState;

#[derive(Serialize, Deserialize)]
struct InstallInfo {
    core_name: String,
    zip_url: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct InstallDetails {
    success: bool,
    files: Option<Vec<PathStatus>>,
}

#[derive(Serialize, Deserialize, Clone)]
struct PathStatus {
    path: String,
    exists: bool,
}

#[derive(Serialize, Deserialize, Clone)]
struct InstallConfirmation {
    paths: Vec<PathBuf>,
    allow: bool,
}

#[derive(Serialize, Deserialize, Clone)]
struct CoreProgress {
    max: usize,
    value: usize,
}

pub fn start_zip_thread(app: &App) -> Result<(), Box<(dyn std::error::Error + 'static)>> {
    let app_handle = app.handle();

    thread::spawn(move || {
        let main_window = app_handle.get_window("main").unwrap();
        let main_window_b = app_handle.get_window("main").unwrap();

        main_window.listen("install-core", move |event| {
            tokio::task::block_in_place(|| {
                tauri::async_runtime::block_on(async {
                    let state: tauri::State<PocketSyncState> = app_handle.state();
                    let pocket_path = state.0.read().await;

                    let install: InstallInfo =
                        serde_json::from_str(event.payload().unwrap()).unwrap();
                    let response = reqwest::get(install.zip_url).await.unwrap();

                    // dbg!(&response);

                    match response.status() {
                        StatusCode::OK => {
                            let zip_file = response.bytes().await.unwrap();
                            let cursor = Cursor::new(zip_file);
                            let archive = zip::ZipArchive::new(cursor).unwrap();

                            start_zip_install_flow(
                                archive,
                                String::from("Install Core"),
                                pocket_path.clone(),
                                &main_window_b,
                            )
                            .await
                            .unwrap();
                        }
                        _s => {
                            main_window_b
                                .emit(
                                    "install-details",
                                    InstallDetails {
                                        success: false,
                                        files: None,
                                    },
                                )
                                .unwrap();
                        }
                    }
                });
            })
        })
    });

    Ok(())
}

async fn start_zip_install_flow(
    mut archive: ZipArchive<impl std::io::Read + std::io::Seek + std::marker::Send + 'static>,
    title: String,
    pocket_path: PathBuf,
    window: &Window,
) -> Result<(), ()> {
    window
        .emit(
            "install-details",
            InstallDetails {
                success: true,
                files: Some(get_file_names(&archive, &pocket_path)),
            },
        )
        .unwrap();

    let main_window_c = window.clone();

    window.once("install-confirmation", move |event| {
        let install_confirm: InstallConfirmation =
            serde_json::from_str(event.payload().unwrap()).unwrap();

        if !install_confirm.allow {
            main_window_c.emit("core-installed", ()).unwrap();
            return ();
        }

        let tmp_dir = TempDir::new(&title).unwrap();
        let tmp_path = tmp_dir.into_path();
        archive.extract(&tmp_path).unwrap();

        for (index, path) in install_confirm.paths.iter().enumerate() {
            let destination = pocket_path.join(&path);
            let source = tmp_path.join(&path);

            if destination.is_dir() && destination.exists() {
                continue;
            }

            // println!("copy from {:?} to {:?}", &source, &destination);

            fs::create_dir_all(destination.parent().unwrap()).unwrap();
            if !source.is_dir() {
                fs::copy(&source, &destination).unwrap();
            }

            main_window_c
                .emit(
                    "core-progress",
                    CoreProgress {
                        value: index + 1,
                        max: install_confirm.paths.len(),
                    },
                )
                .unwrap();
        }
        main_window_c.emit("core-installed", ()).unwrap();
    });

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
