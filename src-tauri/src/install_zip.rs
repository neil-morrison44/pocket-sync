use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use std::{fs, io::Cursor, path::PathBuf, thread};
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
struct InstallZipEventPayload {
    title: String,
    files: Option<Vec<PathStatus>>,
    progress: Option<ZipInstallProgress>,
}

#[derive(Serialize, Deserialize, Clone)]
struct ZipInstallFinishedPayload {
    error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
struct ZipInstallProgress {
    max: usize,
    value: usize,
}

struct Titles {
    title: String,
    installing_title: String,
}

pub fn start_zip_thread(app: &App) -> Result<(), Box<(dyn std::error::Error + 'static)>> {
    let app_handle = app.handle();

    thread::spawn(move || {
        let main_window = app_handle.get_window("main").unwrap();
        let main_window_b = app_handle.get_window("main").unwrap();

        main_window.listen("install-core", move |event| {
            emit_progress("Install Core", None, None, &main_window_b);

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
                                Titles {
                                    title: String::from("Install Core"),
                                    installing_title: (String::from("Installing Core...")),
                                },
                                pocket_path.clone(),
                                &main_window_b,
                            )
                            .await
                            .unwrap();
                        }
                        _s => {
                            emit_finished(
                                Some(String::from("Unable to download ZIP")),
                                &main_window_b,
                            );
                        }
                    }
                });
            })
        })
    });

    Ok(())
}

fn emit_progress(
    title: &str,
    files: Option<Vec<PathStatus>>,
    progress: Option<ZipInstallProgress>,
    window: &Window,
) -> () {
    window
        .emit(
            "install-zip-event",
            InstallZipEventPayload {
                title: String::from(title),
                files: files,
                progress,
            },
        )
        .unwrap();
}

fn emit_finished(error: Option<String>, window: &Window) -> () {
    window
        .emit("install-zip-finished", ZipInstallFinishedPayload { error })
        .unwrap();
}

async fn start_zip_install_flow(
    mut archive: ZipArchive<impl std::io::Read + std::io::Seek + std::marker::Send + 'static>,
    titles: Titles,
    pocket_path: PathBuf,
    window: &Window,
) -> Result<(), ()> {
    emit_progress(
        &titles.title,
        Some(get_file_names(&archive, &pocket_path)),
        None,
        &window,
    );

    let main_window_c = window.clone();

    window.once("install-confirmation", move |event| {
        let install_confirm: InstallConfirmation =
            serde_json::from_str(event.payload().unwrap()).unwrap();

        if !install_confirm.allow {
            emit_finished(None, &main_window_c);
            return ();
        }

        emit_progress(
            &titles.installing_title,
            None,
            Some(ZipInstallProgress {
                value: 0,
                max: install_confirm.paths.len(),
            }),
            &main_window_c,
        );

        let tmp_dir = TempDir::new("zip_install_tmp").unwrap();
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

            emit_progress(
                &titles.installing_title,
                None,
                Some(ZipInstallProgress {
                    value: index + 1,
                    max: install_confirm.paths.len(),
                }),
                &main_window_c,
            );
        }
        emit_finished(None, &main_window_c);
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
