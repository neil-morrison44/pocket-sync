#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use async_walkdir::{DirEntry, Filtering, WalkDir};
use checks::{check_if_folder_looks_like_pocket, start_connection_thread};
use clean_fs::find_dotfiles;
use file_cache::{clear_file_caches, get_file_with_cache};
use firmware::{FirmwareDetails, FirmwareListItem};
use futures::StreamExt;
use futures_locks::RwLock;
use hashes::crc32_for_file;
use install_zip::start_zip_thread;
use save_sync_session::start_mister_save_sync_session;
use saves_zip::{
    build_save_zip, read_save_zip_list, read_saves_in_folder, read_saves_in_zip,
    restore_save_from_zip, SaveZipFile,
};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs::{self};
use std::io::Write;
use std::path::PathBuf;
use std::time::SystemTime;
use std::vec;
use tauri::api::{dialog, file};
use tauri::{App, Window};
use tokio::io::AsyncReadExt;
mod checks;
mod clean_fs;
mod file_cache;
mod firmware;
mod hashes;
mod install_zip;
mod news_feed;
mod progress;
mod save_sync_session;
mod saves_zip;

#[derive(Default)]
struct InnerState {
    pocket_path: RwLock<PathBuf>,
}

struct PocketSyncState(InnerState);

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command(async)]
async fn open_pocket(state: tauri::State<'_, PocketSyncState>) -> Result<Option<String>, ()> {
    if let Some(pocket_path) = dialog::blocking::FileDialogBuilder::new().pick_folder() {
        open_pocket_folder(state, &pocket_path.to_str().unwrap()).await
    } else {
        Err(())
    }
}

#[tauri::command(async)]
async fn open_pocket_folder(
    state: tauri::State<'_, PocketSyncState>,
    pocket_path: &str,
) -> Result<Option<String>, ()> {
    let pocket_path = PathBuf::from(pocket_path);
    if !check_if_folder_looks_like_pocket(&pocket_path) {
        return Ok(None);
    }
    let mut pocket_path_state = state.0.pocket_path.write().await;
    *pocket_path_state = pocket_path.clone();
    Ok(Some(String::from(pocket_path_state.to_str().unwrap())))
}

#[tauri::command(async)]
async fn read_binary_file(
    state: tauri::State<'_, PocketSyncState>,
    path: &str,
    app_handle: tauri::AppHandle,
) -> Result<Vec<u8>, ()> {
    let pocket_path = state.0.pocket_path.read().await;
    let path = pocket_path.join(path);

    let mut f = if let Some(cache_dir) = app_handle.path_resolver().app_cache_dir() {
        get_file_with_cache(&path, &cache_dir).await
    } else {
        tokio::fs::File::open(&path).await
    }
    .expect(&format!("no file found: {:?}", &path));

    let mut buffer = vec![];
    f.read_to_end(&mut buffer)
        .await
        .expect(&format!("failed to read file: {:?}", path));

    Ok(buffer)
}

#[tauri::command(async)]
async fn read_text_file(
    state: tauri::State<'_, PocketSyncState>,
    path: &str,
    app_handle: tauri::AppHandle,
) -> Result<String, ()> {
    let pocket_path = state.0.pocket_path.read().await;
    let path = pocket_path.join(path);

    let mut f = if let Some(cache_dir) = app_handle.path_resolver().app_cache_dir() {
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
async fn file_exists(state: tauri::State<'_, PocketSyncState>, path: &str) -> Result<bool, ()> {
    let pocket_path = state.0.pocket_path.read().await;
    let path = pocket_path.join(path);
    // println!("checking if file exists @{:?}", &path);
    Ok(path.exists())
}

#[tauri::command(async)]
fn save_file(path: &str, buffer: Vec<u8>) -> Result<bool, ()> {
    let file_path = PathBuf::from(path);
    // println!("Saving file {:?}", &file_path);
    fs::create_dir_all(file_path.parent().unwrap()).unwrap();
    let mut file = fs::File::create(file_path).unwrap();
    file.write_all(&buffer).unwrap();
    Ok(true)
}

#[tauri::command(async)]
async fn list_files(
    path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    let pocket_path = state.0.pocket_path.read().await;
    let dir_path = pocket_path.join(path);

    if !dir_path.exists() {
        return Ok(vec![]);
    }

    let paths = fs::read_dir(dir_path).unwrap();

    Ok(paths
        .into_iter()
        .filter(Result::is_ok)
        .map(|p| p.unwrap())
        .map(|p| p.file_name().into_string().unwrap())
        .filter(|s| !s.starts_with("."))
        .collect())
}

#[tauri::command(async)]
async fn walkdir_list_files(
    path: &str,
    extensions: Vec<&str>,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    let pocket_path = state.0.pocket_path.read().await;
    let dir_path = pocket_path.join(path);

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
        if !entry.file_type().await.is_ok_and(|f| f.is_file()) {
            continue;
        }
        if is_hidden(&entry) {
            continue;
        }
        let path = entry.path();
        let path_str = path.to_str().unwrap();
        let relative_path = path_str.replace(dir_path_str, "");
        if extensions.is_empty() || extensions.iter().any(|ext| path_str.ends_with(ext)) {
            file_paths.push(relative_path);
        }
    }

    Ok(file_paths)
}

#[tauri::command(async)]
async fn uninstall_core(
    core_name: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    let pocket_path = state.0.pocket_path.write().await;
    let core_path = pocket_path.join("Cores").join(core_name);
    // println!("I will remove {:?}", &core_path);
    if core_path.exists() && core_path.is_dir() {
        // not sure why this doesn't work
        // fs::remove_dir_all(core_path).unwrap();

        if let Ok(entries) = std::fs::read_dir(&core_path) {
            for entry in entries {
                let path = entry.unwrap().path();
                // println!("{:?}", path);

                if path.exists() {
                    std::fs::remove_file(path).unwrap();
                }
            }
        };

        fs::remove_dir(&core_path).unwrap();
    } else {
        println!("Weird, it's gone already");
    }

    Ok(true)
}

#[tauri::command(async)]
async fn install_archive_files(
    files: Vec<DownloadFile>,
    archive_url: &str,
    state: tauri::State<'_, PocketSyncState>,
    window: Window,
) -> Result<bool, ()> {
    let pocket_path = state.0.pocket_path.read().await;
    let file_count = files.len();

    let mut failed_already = HashSet::new();
    let mut progress = progress::ProgressEmitter::start(file_count, &window);

    for file in files {
        let full_url = format!("{}/{}", archive_url, file.filename);
        progress.emit_progress(&file.filename);

        if !failed_already.contains(&file.filename) {
            let response = reqwest::get(&full_url).await;

            match response {
                Err(e) => {
                    println!("Error downloading from {full_url}: ({e})");
                    failed_already.insert(file.filename);
                }
                Ok(r) => {
                    if r.status() != 200 {
                        println!("Unable to find {full_url}, skipping");
                        failed_already.insert(file.filename);
                    } else {
                        let folder = pocket_path.join(file.path);

                        if !folder.exists() {
                            fs::create_dir_all(&folder).unwrap();
                        }

                        let new_file_path = folder.join(&file.filename);
                        let mut dest = fs::File::create(&new_file_path).unwrap();
                        let content = r.bytes().await.unwrap();
                        let mut content_cusror = std::io::Cursor::new(content);
                        std::io::copy(&mut content_cusror, &mut dest).unwrap();
                    }
                }
            }
        }
    }

    progress.end();

    Ok(true)
}

#[tauri::command(async)]
async fn backup_saves(
    save_paths: Vec<&str>,
    zip_path: &str,
    max_count: usize,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    let pocket_path = state.0.pocket_path.read().await;
    build_save_zip(&pocket_path, save_paths, zip_path, max_count)
        .await
        .unwrap();

    Ok(true)
}

#[tauri::command(async)]
async fn list_backup_saves(backup_path: &str) -> Result<BackupSavesResponse, ()> {
    let path = PathBuf::from(backup_path);
    if !path.exists() {
        return Ok(BackupSavesResponse {
            files: vec![],
            exists: false,
        });
    }

    let files = read_save_zip_list(&path).await.unwrap();

    Ok(BackupSavesResponse {
        files,
        exists: true,
    })
}

#[tauri::command(async)]
async fn list_saves_in_zip(zip_path: &str) -> Result<Vec<SaveZipFile>, ()> {
    let path = PathBuf::from(zip_path);
    if !path.exists() {
        return Ok(vec![]);
    }

    read_saves_in_zip(&path).await
}

#[tauri::command(async)]
async fn list_saves_on_pocket(
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<SaveZipFile>, ()> {
    let pocket_path = state.0.pocket_path.read().await;
    let saves_path = pocket_path.join("Saves");
    read_saves_in_folder(&saves_path).await
}

#[tauri::command(async)]
async fn restore_save(
    zip_path: &str,
    file_path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<(), ()> {
    let pocket_path = state.0.pocket_path.read().await;
    let path = PathBuf::from(zip_path);
    restore_save_from_zip(&path, file_path, &pocket_path);

    Ok(())
}

#[tauri::command(async)]
async fn create_folder_if_missing(path: &str) -> Result<bool, ()> {
    let folder_path = PathBuf::from(path);
    if !folder_path.exists() {
        fs::create_dir_all(path).unwrap();
        return Ok(true);
    }

    Ok(false)
}

#[tauri::command(async)]
async fn delete_files(
    paths: Vec<&str>,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
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
async fn find_cleanable_files(
    path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, String> {
    let pocket_path = state.0.pocket_path.read().await;
    let root_path = pocket_path.join(path);
    let files = find_dotfiles(&root_path).await.unwrap();

    Ok(files)
}

#[tauri::command]
async fn list_instance_packageable_cores(
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    let pocket_path = state.0.pocket_path.read().await;
    Ok(instance_packager::find_cores_with_package_json(&pocket_path).unwrap())
}

#[tauri::command]
async fn run_packager_for_core(
    state: tauri::State<'_, PocketSyncState>,
    core_name: &str,
    window: Window,
) -> Result<(), ()> {
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
    let feed = news_feed::get_feed_json().await;
    Ok(feed)
}

#[tauri::command(async)]
async fn begin_mister_sync_session(
    host: &str,
    user: &str,
    password: &str,
    window: tauri::Window,
) -> Result<bool, String> {
    match start_mister_save_sync_session(host, user, password, window).await {
        Ok(success) => return Ok(success),
        Err(err) => return Err(err.to_string()),
    }
}

#[tauri::command(async)]
async fn get_file_metadata(
    state: tauri::State<'_, PocketSyncState>,
    file_path: &str,
) -> Result<FileMetadata, String> {
    let pocket_path = state.0.pocket_path.read().await;
    let full_path = pocket_path.join(file_path);

    let crc32 = crc32_for_file(&full_path)
        .await
        .map_err(|err| err.to_string())?;

    let metadata = fs::metadata(full_path)
        .and_then(|m| m.modified())
        .map_err(|err| err.to_string())?;

    let timestamp = metadata
        .duration_since(SystemTime::UNIX_EPOCH)
        .and_then(|d| Ok(d.as_secs()))
        .map_err(|err| err.to_string())?;

    Ok(FileMetadata {
        timestamp_secs: timestamp,
        crc32,
    })
}
#[tauri::command(async)]
async fn get_firmware_versions_list() -> Result<Vec<FirmwareListItem>, String> {
    firmware::get_firmware_json()
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command(async)]
async fn get_firmware_release_notes(version: &str) -> Result<FirmwareDetails, String> {
    firmware::get_release_notes(version)
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command(async)]
async fn download_firmware(
    url: &str,
    md5: &str,
    file_name: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, String> {
    let pocket_path = state.0.pocket_path.read().await;
    let file_path = pocket_path.join(file_name);
    let mut attempts = 0;

    loop {
        firmware::download_firmware_file(url, &file_path)
            .await
            .map_err(|err| err.to_string())?;

        match (
            firmware::verify_firmware_file(&file_path, md5)
                .await
                .map_err(|err| err.to_string())?,
            attempts > 3,
        ) {
            (true, _) => return Ok(true),
            (false, true) => return Ok(false),
            (false, false) => {
                attempts += 1;
                continue;
            }
        }
    }
}

#[tauri::command(async)]
async fn clear_file_cache(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(cache_dir) = app_handle.path_resolver().app_cache_dir() {
        clear_file_caches(&cache_dir)
            .await
            .map_err(|err| err.to_string())?
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .manage(PocketSyncState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            open_pocket,
            open_pocket_folder,
            list_files,
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
            find_cleanable_files,
            list_instance_packageable_cores,
            run_packager_for_core,
            get_news_feed,
            begin_mister_sync_session,
            get_file_metadata,
            get_firmware_versions_list,
            get_firmware_release_notes,
            download_firmware,
            clear_file_cache
        ])
        .setup(|app| start_threads(&app))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn start_threads(app: &App) -> Result<(), Box<(dyn std::error::Error + 'static)>> {
    start_connection_thread(&app).unwrap();
    start_zip_thread(&app).unwrap();
    Ok(())
}

#[derive(Serialize, Deserialize)]
struct DownloadFile {
    filename: String,
    path: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct FileProgressPayload {
    value: usize,
    max: usize,
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
