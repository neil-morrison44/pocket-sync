#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use async_walkdir::{DirEntry, WalkDir};
use checks::{check_if_folder_looks_like_pocket, connection_task};
use clean_fs::find_dotfiles;
use extism::CancelHandle;
use file_cache::{clear_file_caches, get_file_with_cache};
use file_locks::FileLocks;
use firmware::{FirmwareDetails, FirmwareListItem};
use futures::stream::{self, StreamExt};
use futures_locks::RwLock;
use hashes::crc32_for_file;
use install_zip::start_zip_task;
use job_id::{Job, JobState};
use log::{LevelFilter, debug, error, trace};
use required_files::{DataSlotFile, required_files_for_core};
use root_files::RootFile;
use save_sync_session::start_mister_save_sync_session;
use saves_zip::{
    SaveZipFile, build_save_zip, read_save_zip_list, read_saves_in_folder, read_saves_in_zip,
    remove_leading_slash, restore_save_from_zip,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::SystemTime;
use std::vec;
use tauri::{App, Emitter, Manager, Window};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_log::{Target, TargetKind};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::sync::Mutex;

use crate::app_error::AppError;
use crate::install_files::install_file;
use crate::util::{find_common_path, get_mtime_timestamp};

mod checks;
mod clean_fs;
mod core_json_files;
mod file_cache;
mod file_locks;
mod firmware;
mod hashes;
mod install_files;
mod install_zip;
mod job_id;
mod news_feed;
mod palettes;
mod progress;
mod required_files;
mod root_files;
mod save_sync_session;
mod saves_zip;
mod turbo_downloads;
mod util;

mod app_error;
mod commands;

#[derive(Default)]
struct InnerState {
    pocket_path: RwLock<PathBuf>,
    file_locker: FileLocks,
    active_plugin_handles: Mutex<HashMap<String, CancelHandle>>,
    jobs: JobState,
}

struct PocketSyncState(InnerState);

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command(async)]
async fn open_pocket(
    state: tauri::State<'_, PocketSyncState>,
    app_handle: tauri::AppHandle,
) -> Result<Option<String>, ()> {
    debug!("Command: open_pocket");

    if let Some(tauri_plugin_dialog::FilePath::Path(pocket_path)) =
        app_handle.dialog().file().blocking_pick_folder()
    {
        open_pocket_folder(state, &pocket_path.to_str().unwrap(), app_handle).await
    } else {
        Ok(None)
    }
}

#[tauri::command(async)]
async fn open_pocket_folder(
    state: tauri::State<'_, PocketSyncState>,
    pocket_path: &str,
    app_handle: tauri::AppHandle,
) -> Result<Option<String>, ()> {
    debug!("Command: open_pocket_folder {pocket_path}");
    let window = app_handle.get_webview_window("main").unwrap();
    let pocket_path = PathBuf::from(pocket_path);
    if !check_if_folder_looks_like_pocket(&pocket_path) {
        return Ok(None);
    }
    let mut pocket_path_state = state.0.pocket_path.write().await;
    *pocket_path_state = pocket_path.clone();

    {
        let window = window.clone();
        let path_buf = pocket_path.clone();
        tauri::async_runtime::spawn(async move { connection_task(window, path_buf).await });
    }

    Ok(Some(String::from(pocket_path_state.to_str().unwrap())))
}

#[tauri::command(async)]
async fn read_binary_file(
    state: tauri::State<'_, PocketSyncState>,
    path: &str,
    app_handle: tauri::AppHandle,
) -> Result<Vec<u8>, String> {
    debug!("Command: read_binary_file - {path}");
    let pocket_path = state.0.pocket_path.read().await;
    let path = pocket_path.join(path);

    let arc_lock = state.0.file_locker.find_lock_for(&path).await;
    let _read_lock = arc_lock.read().await;

    if let Ok(mut f) = if let Ok(cache_dir) = app_handle.path().app_cache_dir() {
        get_file_with_cache(&path, &cache_dir).await
    } else {
        tokio::fs::File::open(&path).await
    } {
        let mut buffer = vec![];
        f.read_to_end(&mut buffer)
            .await
            .expect(&format!("failed to read file: {:?}", path));

        Ok(buffer)
    } else {
        Err(format!("No file found: {}", path.display()))
    }
}

#[tauri::command(async)]
async fn read_text_file(
    state: tauri::State<'_, PocketSyncState>,
    path: &str,
    app_handle: tauri::AppHandle,
) -> Result<String, ()> {
    debug!("Command: read_text_file - {path}");
    let pocket_path = state.0.pocket_path.read().await;
    let path = pocket_path.join(path);

    let arc_lock = state.0.file_locker.find_lock_for(&path).await;
    let _read_lock = arc_lock.read().await;

    let mut f = if let Ok(cache_dir) = app_handle.path().app_cache_dir() {
        get_file_with_cache(&path, &cache_dir).await
    } else {
        tokio::fs::File::open(&path).await
    }
    .expect(&format!("no file found: {:?}", &path));

    let mut file_contents = String::new();
    f.read_to_string(&mut file_contents)
        .await
        .expect(&format!("failed to read file: {:?}", path));
    Ok(file_contents)
}

#[tauri::command(async)]
async fn file_exists(
    state: tauri::State<'_, PocketSyncState>,
    path: &str,
) -> Result<bool, AppError> {
    trace!("Command: file_exists - {path}");
    let pocket_path = state.0.pocket_path.read().await;
    let path = pocket_path.join(path);

    let exists = tokio::fs::try_exists(&path).await?;
    Ok(exists)
}

#[tauri::command(async)]
async fn save_file(
    path: &str,
    buffer: Vec<u8>,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    debug!("Command: save_file - {path}");
    let file_path = PathBuf::from(path);
    let folder_path = file_path.parent().unwrap();
    let arc_lock = state.0.file_locker.find_lock_for(&file_path).await;
    let _write_lock = arc_lock.write().await;
    tokio::fs::create_dir_all(&folder_path).await.unwrap();
    let mut file = tokio::fs::File::create(file_path).await.unwrap();
    file.write_all(&buffer).await.unwrap();
    file.flush().await.unwrap();
    Ok(true)
}

#[tauri::command(async)]
async fn list_files(
    path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    debug!("Command: list_files - {path}");
    let pocket_path = state.0.pocket_path.read().await;
    let dir_path = pocket_path.join(path);

    let arc_lock = state.0.file_locker.find_lock_for(&dir_path).await;
    trace!("list_files lock requested");
    let _read_lock = arc_lock.read().await;
    trace!("list_files lock granted");

    if !tokio::fs::try_exists(&dir_path).await.unwrap() {
        return Ok(vec![]);
    }

    let mut paths = tokio::fs::read_dir(dir_path).await.unwrap();
    let mut results: Vec<_> = Vec::new();

    while let Ok(Some(entry)) = paths.next_entry().await {
        let file_type = entry.file_type().await.unwrap();
        if file_type.is_file() {
            let file_name = entry.file_name();
            let file_name = file_name.to_str().unwrap();

            if !file_name.starts_with(".") {
                results.push(String::from(file_name))
            }
        }
    }

    Ok(results)
}

#[tauri::command(async)]
async fn list_folders(
    path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    debug!("Command: list_folders - {path}");
    let pocket_path = state.0.pocket_path.read().await;
    let dir_path = pocket_path.join(path);

    let arc_lock = state.0.file_locker.find_lock_for(&dir_path).await;
    let _read_lock = arc_lock.read().await;

    if !tokio::fs::try_exists(&dir_path).await.unwrap() {
        return Ok(vec![]);
    }

    let mut paths = tokio::fs::read_dir(dir_path).await.unwrap();
    let mut results: Vec<_> = Vec::new();

    while let Ok(Some(entry)) = paths.next_entry().await {
        let file_type = entry.file_type().await.unwrap();
        if file_type.is_dir() {
            let file_name = entry.file_name();
            let file_name = file_name.to_str().unwrap();

            if !file_name.starts_with(".") {
                results.push(String::from(file_name))
            }
        }
    }

    Ok(results)
}

#[tauri::command(async)]
async fn walkdir_list_files(
    path: &str,
    extensions: Vec<&str>,
    off_pocket: Option<bool>,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    debug!("Command: walkdir_list_files - {path}");
    let pocket_path = state.0.pocket_path.read().await;
    let dir_path = match off_pocket {
        Some(true) => PathBuf::from(path),
        None | Some(false) => pocket_path.join(remove_leading_slash(path)),
    };

    let arc_lock = state.0.file_locker.find_lock_for(&dir_path).await;
    let _read_lock = arc_lock.read().await;

    if !dir_path.exists() {
        return Ok(vec![]);
    }

    fn is_hidden(entry: &DirEntry) -> bool {
        entry
            .file_name()
            .to_str()
            .map(|s| s.starts_with("."))
            .unwrap_or(false)
    }

    let mut walker = WalkDir::new(&dir_path);
    let dir_path_str = &dir_path.to_str().unwrap();
    let mut file_paths = Vec::new();

    while let Some(Ok(entry)) = walker.next().await {
        match entry.file_type().await {
            Ok(f) => {
                if f.is_file() && !is_hidden(&entry) {
                    let path = entry.path();
                    let path_str = path.to_str().unwrap();
                    let relative_path = path_str.replace(dir_path_str, "");
                    if extensions.is_empty() || extensions.iter().any(|ext| path_str.ends_with(ext))
                    {
                        file_paths.push(relative_path);
                    }
                }
            }
            Err(_) => continue,
        }
    }

    Ok(file_paths)
}

#[tauri::command(async)]
async fn uninstall_core(
    core_name: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    debug!("Command: uninstall_core - {core_name}");
    let pocket_path = state.0.pocket_path.read().await;

    let paths = vec![
        pocket_path.join("Cores").join(core_name),
        pocket_path.join("Presets").join(core_name),
        pocket_path.join("Settings").join(core_name),
    ];

    for path in paths {
        if path.exists() && path.is_dir() {
            tokio::fs::remove_dir_all(path).await.unwrap();
        } else {
            error!("Weird, it's gone already");
        }
    }

    Ok(true)
}

#[tauri::command(async)]
async fn install_archive_files(
    files: Vec<DataSlotFile>,
    archive_url: &str,
    job_id: Option<&str>,
    turbo: bool,
    state: tauri::State<'_, PocketSyncState>,
    window: Window,
) -> Result<bool, String> {
    debug!("Command: install_archive_files");

    let pocket_path = state.0.pocket_path.read().await;
    let job_id = job_id.unwrap_or("install_archive_files");
    let job_handle = state.0.jobs.start_job(job_id).await;

    let all_paths: Vec<PathBuf> = files.iter().map(|d| pocket_path.join(&d.path)).collect();
    let common_dir = find_common_path(&all_paths).unwrap();

    let arc_lock = state.0.file_locker.find_lock_for(&common_dir).await;
    let _write_lock = arc_lock.write().await;

    let mut progress = progress::ProgressEmitter::new(Box::new(|event| {
        window
            .emit(&format!("progress-event::{job_id}"), event)
            .unwrap();
    }));

    progress.begin_work_units(files.len());
    for file in files {
        if !job_handle.is_alive().await {
            break;
        }
        progress.set_message("downloading", Some(&file.name));
        let file_name = file.name.clone();
        if let Err(err) = install_file(file, archive_url, turbo, &pocket_path).await {
            error!("Error: {} download file {}", err, &file_name);
        };

        progress.complete_work_units(1);
    }

    Ok(true)
}

#[tauri::command(async)]
async fn backup_saves(
    save_paths: Vec<&str>,
    zip_path: &str,
    max_count: usize,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    debug!("Command: backup_saves");
    let pocket_path = state.0.pocket_path.read().await;
    build_save_zip(&pocket_path, save_paths, zip_path, max_count)
        .await
        .unwrap();

    Ok(true)
}

#[tauri::command(async)]
async fn list_backup_saves(backup_path: &str) -> Result<BackupSavesResponse, AppError> {
    debug!("Command: list_backup_saves");
    let path = PathBuf::from(backup_path);
    if !path.exists() {
        return Ok(BackupSavesResponse {
            files: vec![],
            exists: false,
        });
    }

    let files = read_save_zip_list(&path).await?;

    Ok(BackupSavesResponse {
        files,
        exists: true,
    })
}

#[tauri::command(async)]
async fn list_saves_in_zip(zip_path: &str) -> Result<Vec<SaveZipFile>, AppError> {
    debug!("Command: list_saves_in_zip");
    let path = PathBuf::from(zip_path);
    if !path.exists() {
        return Ok(vec![]);
    }

    Ok(read_saves_in_zip(&path).await?)
}

#[tauri::command(async)]
async fn list_saves_on_pocket(
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<SaveZipFile>, AppError> {
    debug!("Command: list_saves_on_pocket");
    let pocket_path = state.0.pocket_path.read().await;
    let saves_path = pocket_path.join("Saves");
    Ok(read_saves_in_folder(&saves_path).await?)
}

#[tauri::command(async)]
async fn restore_save(
    zip_path: &str,
    file_path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<(), ()> {
    debug!("Command: restore_save");
    let pocket_path = state.0.pocket_path.read().await;
    let path = PathBuf::from(zip_path);
    restore_save_from_zip(&path, file_path, &pocket_path).await;

    Ok(())
}

#[tauri::command(async)]
async fn create_folder_if_missing(path: &str) -> Result<bool, ()> {
    debug!("Command: create_folder_if_missing - {path}");
    let folder_path = PathBuf::from(path);
    if !folder_path.exists() {
        tokio::fs::create_dir_all(path).await.unwrap();
        return Ok(true);
    }

    Ok(false)
}

#[tauri::command(async)]
async fn delete_files(
    paths: Vec<&str>,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    debug!("Command: delete_files");
    let pocket_path = state.0.pocket_path.read().await;

    let tasks: Vec<_> = paths
        .into_iter()
        .filter_map(|path| {
            let file_path = pocket_path.join(path);
            file_path
                .exists()
                .then(|| tokio::fs::remove_file(file_path))
        })
        .collect();

    futures::future::join_all(tasks).await;
    Ok(true)
}

#[tauri::command(async)]
async fn copy_files(
    copies: Vec<(&str, &str)>,
    window: Window,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    debug!("Command: copy_files");

    let mut progress = progress::ProgressEmitter::new(Box::new(|event| {
        window.emit("progress-event::copy_files", event).unwrap();
    }));

    progress.begin_work_units(copies.len());

    let all_dests: Vec<PathBuf> = copies
        .iter()
        .map(|(_source, dest)| PathBuf::from(dest))
        .collect();
    let common_dir = find_common_path(&all_dests).unwrap();
    let arc_lock = state.0.file_locker.find_lock_for(&common_dir).await;
    let _write_lock = arc_lock.write().await;

    for (origin, destination) in copies {
        let origin = PathBuf::from(origin);
        let destination = PathBuf::from(&destination);

        if let Err(err) = match tokio::fs::create_dir_all(destination.parent().unwrap()).await {
            Ok(_) => tokio::fs::copy(&origin, &destination).await,
            Err(e) => Err(e),
        } {
            error!("{}", err);
        } else {
            progress.complete_work_units(1);
            progress.set_message("file", Some(&destination.to_string_lossy()));
        }
    }

    Ok(true)
}

#[tauri::command(async)]
async fn find_cleanable_files(
    path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, String> {
    debug!("Command: find_cleanable_files");
    let pocket_path = state.0.pocket_path.read().await;
    let root_path = pocket_path.join(path);
    let files = find_dotfiles(&root_path).await.unwrap();

    Ok(files)
}

#[tauri::command]
async fn list_instance_packageable_cores(
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    debug!("Command: list_instance_packageable_cores");
    let pocket_path = state.0.pocket_path.read().await;
    Ok(instance_packager::find_cores_with_package_json(&pocket_path).unwrap())
}

#[tauri::command]
async fn run_packager_for_core(
    state: tauri::State<'_, PocketSyncState>,
    core_name: &str,
    window: Window,
) -> Result<(), ()> {
    debug!("Command: run_packager_for_core");
    let pocket_path = state.0.pocket_path.read().await;

    let emit_event = |file_name, success, message| {
        window
            .emit(
                "instance-packager-event-payload",
                InstancePackageEventPayload {
                    file_name: String::from(file_name),
                    success: success,
                    message: message,
                },
            )
            .unwrap()
    };

    Ok(instance_packager::build_jsons_for_core(
        &pocket_path,
        core_name,
        true,
        |file_name| {
            emit_event(String::from(file_name), true, None);
        },
        |file_name, message| {
            emit_event(String::from(file_name), false, Some(String::from(message)));
        },
    )
    .unwrap())
}

#[tauri::command(async)]
async fn get_news_feed() -> Result<Vec<news_feed::FeedItem>, String> {
    debug!("Command: get_news_feed");
    let feed = news_feed::get_feed_json().await;
    Ok(feed)
}

#[tauri::command(async)]
async fn begin_mister_sync_session(
    host: &str,
    user: &str,
    password: &str,
    window: tauri::WebviewWindow,
) -> Result<bool, String> {
    debug!("Command: begin_mister_sync_session");
    match start_mister_save_sync_session(host, user, password, window).await {
        Ok(success) => return Ok(success),
        Err(err) => return Err(err.to_string()),
    }
}

#[tauri::command(async)]
async fn get_file_metadata(
    state: tauri::State<'_, PocketSyncState>,
    file_path: &str,
) -> Result<FileMetadata, AppError> {
    trace!("Command: get_file_metadata");
    let pocket_path = state.0.pocket_path.read().await;
    let full_path = pocket_path.join(file_path);

    let crc32 = crc32_for_file(&full_path).await?;

    let metadata = tokio::fs::metadata(full_path)
        .await
        .and_then(|m| m.modified())?;

    let timestamp = metadata
        .duration_since(SystemTime::UNIX_EPOCH)
        .and_then(|d| Ok(d.as_secs()))?;

    Ok(FileMetadata {
        timestamp_secs: timestamp,
        crc32,
    })
}

#[tauri::command(async)]
async fn get_file_metadata_mtime_only(
    state: tauri::State<'_, PocketSyncState>,
    file_path: &str,
) -> Result<u64, AppError> {
    trace!("Command: get_file_metadata_mtime_only");
    let pocket_path = state.0.pocket_path.read().await;
    let full_path = pocket_path.join(file_path);

    Ok(get_mtime_timestamp(&full_path).await?)
}

#[tauri::command(async)]
async fn get_firmware_versions_list() -> Result<Vec<FirmwareListItem>, AppError> {
    debug!("Command: get_firmware_versions_list");
    Ok(firmware::get_firmware_json().await?)
}

#[tauri::command(async)]
async fn get_firmware_release_notes(version: &str) -> Result<FirmwareDetails, AppError> {
    debug!("Command: get_firmware_release_notes");
    Ok(firmware::get_release_notes(version).await?)
}

#[tauri::command(async)]
async fn download_firmware(
    url: &str,
    md5: &str,
    file_name: &str,
    state: tauri::State<'_, PocketSyncState>,
    window: tauri::Window,
) -> Result<bool, AppError> {
    debug!("Command: download_firmware");
    let pocket_path = state.0.pocket_path.read().await;
    let file_path = pocket_path.join(file_name);

    let arc_lock = state.0.file_locker.find_lock_for(&pocket_path).await;
    let _write_lock = arc_lock.write().await;

    firmware::download_firmware_file(url, &file_path, &window).await?;

    debug!("firmware downloaded");

    let verify = firmware::verify_firmware_file(&file_path, md5).await?;

    if !verify {
        debug!("firmware verification failed");
        tokio::fs::remove_file(&file_path).await?;
    }

    debug!("firmware verified");

    Ok(verify)
}

#[tauri::command(async)]
async fn clear_file_cache(app_handle: tauri::AppHandle) -> Result<(), AppError> {
    debug!("Command: clear_file_cache");
    if let Ok(cache_dir) = app_handle.path().app_cache_dir() {
        clear_file_caches(&cache_dir).await?
    }
    Ok(())
}

mod files_from_zip;

#[tauri::command(async)]
async fn find_required_files(
    state: tauri::State<'_, PocketSyncState>,
    core_id: &str,
    include_alts: bool,
    archive_url: &str,
    window: tauri::WebviewWindow,
) -> Result<Vec<DataSlotFile>, AppError> {
    debug!("Command: find_required_files");
    let pocket_path = state.0.pocket_path.read().await;

    let core_info: Vec<_> = core_id.split(".").collect();
    let common_dir_path = pocket_path.join(format!("Assets/{}/common", &core_info.last().unwrap()));
    let arc_lock = state.0.file_locker.find_lock_for(&common_dir_path).await;
    let _read_lock = arc_lock.read().await;

    let core_dir_path = pocket_path.join(format!(
        "Assets/{}/{}",
        &core_info.last().unwrap(),
        &core_info.first().unwrap()
    ));

    let arc_lock = state.0.file_locker.find_lock_for(&common_dir_path).await;
    let _read_lock = arc_lock.read().await;

    let arc_lock = state.0.file_locker.find_lock_for(&core_dir_path).await;
    let _read_lock = arc_lock.read().await;

    Ok(required_files_for_core(core_id, &pocket_path, include_alts, archive_url, window).await?)
}

#[tauri::command(async)]
async fn check_root_files(
    state: tauri::State<'_, PocketSyncState>,
    extensions: Option<Vec<&str>>,
) -> Result<Vec<RootFile>, AppError> {
    debug!("Command: check_root_files");
    let pocket_path = state.0.pocket_path.read().await;
    Ok(root_files::check_root_files(&pocket_path, extensions).await?)
}

#[tauri::command(async)]
async fn save_multiple_files(
    state: tauri::State<'_, PocketSyncState>,
    paths: Vec<&str>,
    data: Vec<Vec<u8>>,
) -> Result<(), AppError> {
    debug!("Command: save_multiple_files");
    let pocket_path = state.0.pocket_path.read().await;

    let all_paths: Vec<PathBuf> = paths.iter().map(|p| pocket_path.join(p)).collect();
    let common_dir = find_common_path(&all_paths).unwrap();

    let arc_lock = state.0.file_locker.find_lock_for(&common_dir).await;
    let _write_lock = arc_lock.write().await;

    for (file_path, file_data) in all_paths.iter().zip(data) {
        tokio::fs::write(file_path, file_data).await?;
    }

    Ok(())
}

#[tauri::command(async)]
async fn get_active_jobs(state: tauri::State<'_, PocketSyncState>) -> Result<Vec<Job>, AppError> {
    trace!("Command: get_active_jobs");

    let jobs = state.0.jobs.get_all_jobs().await;
    Ok(jobs)
}

#[tauri::command(async)]
async fn stop_job(job_id: &str, state: tauri::State<'_, PocketSyncState>) -> Result<(), AppError> {
    debug!("Command: stop_job");
    state.0.jobs.stop_job(job_id).await?;
    Ok(())
}

#[tauri::command(async)]
async fn downconvert_all_pal_files(
    state: tauri::State<'_, PocketSyncState>,
    window: tauri::WebviewWindow,
) -> Result<(), AppError> {
    debug!("Command: downconvert_all_pal_files");
    let pocket_path = state.0.pocket_path.read().await;
    let palette_path = PathBuf::from(&pocket_path.as_path()).join("Assets/gb/common/palettes");

    let mut progress = progress::ProgressEmitter::new(Box::new(|event| {
        window
            .emit("progress-event::downconvert_all_pal_files", event)
            .unwrap();
    }));

    let pal_files = palettes::find_all_pal_files(&palette_path).await?;

    progress.begin_work_units(pal_files.len());

    for pal_file in pal_files {
        palettes::down_convert_pal_to_gbp(&pal_file).await?;
        progress.complete_work_units(1);
    }

    Ok(())
}

#[tauri::command(async)]
async fn downconvert_single_pal_file(pal_file_path: String) -> Result<(), AppError> {
    debug!("Command: downconvert_single_pal_file");
    let pal_file_path = PathBuf::from(pal_file_path);

    palettes::down_convert_pal_to_gbp(&pal_file_path).await?;

    Ok(())
}

#[tauri::command(async)]
async fn find_mtime_for_files(full_file_paths: Vec<PathBuf>) -> Result<Vec<Option<u64>>, AppError> {
    debug!("Command: find_mtime_for_files - {}", full_file_paths.len());
    let paths_stream = stream::iter(full_file_paths);

    let results = paths_stream
        .map(|full_path| async move {
            match get_mtime_timestamp(&full_path).await {
                Ok(mtime) => Some(mtime),
                Err(err) => {
                    eprintln!("Error processing {:?}: {}", full_path, err);
                    None // Return None for errors
                }
            }
        })
        .buffered(100)
        .collect::<Vec<Option<u64>>>()
        .await;

    Ok(results)
}

#[tauri::command(async)]
async fn get_folder_size(folder: PathBuf) -> Result<u128, AppError> {
    debug!("Command: get_folder_size - {}", &folder.display());
    let mut size = 0;
    let mut walker = WalkDir::new(&folder);

    while let Some(Ok(entry)) = walker.next().await {
        if entry.path().is_file() {
            if let Ok(meta) = entry.path().metadata() {
                size += meta.len() as u128;
            }
        }
    }

    Ok(size)
}

#[tauri::command(async)]
async fn move_game(
    source_path: PathBuf,
    dest_path: PathBuf,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<(), AppError> {
    debug!(
        "Command: move_game - {:?} to {:?}",
        &source_path, &dest_path
    );
    let pocket_path = state.0.pocket_path.read().await;
    trace!("read pocket path {:?}", &pocket_path);
    let mut source_save_path =
        PathBuf::from(source_path.to_string_lossy().replacen("Assets", "Saves", 1));

    source_save_path.set_extension("sav");

    let mut dest_save_path =
        PathBuf::from(dest_path.to_string_lossy().replacen("Assets", "Saves", 1));
    dest_save_path.set_extension("sav");

    let full_source_path = pocket_path.join(source_path);
    let full_source_save_path = pocket_path.join(source_save_path);
    let full_dest_save_path = pocket_path.join(dest_save_path);
    let full_dest_path = pocket_path.join(dest_path);

    trace!("created paths");

    let dest_path = &full_dest_path.parent().unwrap();

    trace!("dest is {:?}", &dest_path);

    tokio::fs::create_dir_all(&full_dest_path.parent().unwrap()).await?;
    trace!("created dir all {:?}", &full_dest_path);

    tokio::fs::create_dir_all(&full_dest_save_path.parent().unwrap()).await?;
    trace!("created save dir all {:?}", &full_dest_save_path);

    tokio::fs::copy(&full_source_path, &full_dest_path).await?;
    trace!("copied {:?} to {:?}", &full_source_path, &full_dest_path);

    let _ = tokio::fs::copy(&full_source_save_path, &full_dest_save_path).await;

    trace!(
        "copied {:?} to {:?}",
        &full_source_save_path, &full_dest_save_path
    );

    tokio::fs::remove_file(&full_source_path).await?;

    let _ = tokio::fs::remove_file(&full_source_save_path).await;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_locale::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_locale::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::Webview),
                ])
                .level(LevelFilter::Debug)
                .build(),
        )
        .manage(PocketSyncState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            open_pocket,
            open_pocket_folder,
            list_files,
            list_folders,
            walkdir_list_files,
            read_binary_file,
            read_text_file,
            save_file,
            uninstall_core,
            install_archive_files,
            file_exists,
            backup_saves,
            list_backup_saves,
            list_saves_in_zip,
            list_saves_on_pocket,
            restore_save,
            create_folder_if_missing,
            delete_files,
            copy_files,
            find_cleanable_files,
            list_instance_packageable_cores,
            run_packager_for_core,
            get_news_feed,
            begin_mister_sync_session,
            get_file_metadata,
            get_file_metadata_mtime_only,
            get_firmware_versions_list,
            get_firmware_release_notes,
            download_firmware,
            clear_file_cache,
            check_root_files,
            find_required_files,
            save_multiple_files,
            get_active_jobs,
            stop_job,
            downconvert_all_pal_files,
            downconvert_single_pal_file,
            find_mtime_for_files,
            move_game,
            get_folder_size,
            commands::plugins::run_plugin,
            commands::plugins::list_and_install_plugins,
            commands::plugins::uninstall_plugin,
            commands::plugins::kill_plugin
        ])
        .setup(|app| {
            log_panics::init();
            start_tasks(app)
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn start_tasks(app: &App) -> Result<(), Box<dyn std::error::Error + 'static>> {
    let window = &app.get_webview_window("main").unwrap();
    {
        let window = window.clone();
        tauri::async_runtime::spawn(async move { start_zip_task(window).await });
    }

    Ok(())
}

#[derive(Serialize, Deserialize)]
struct BackupSavesResponse {
    files: Vec<SaveZipFile>,
    exists: bool,
}

#[derive(Serialize, Deserialize, Clone)]
struct InstancePackageEventPayload {
    file_name: String,
    success: bool,
    message: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct FileMetadata {
    timestamp_secs: u64,
    crc32: u32,
}
