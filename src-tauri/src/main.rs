#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use checks::{check_if_folder_looks_like_pocket, connection_task};
use extism::CancelHandle;
use file_cache::clear_file_caches;
use file_locks::FileLocks;
use install_zip::start_zip_task;
use job_id::{Job, JobState};
use log::{LevelFilter, debug, info, trace};
use root_files::RootFile;
use save_sync_session::start_mister_save_sync_session;
use saves_zip::SaveZipFile;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::vec;
use tauri::{App, Emitter, Manager, RunEvent};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FsExt;
use tauri_plugin_log::{Target, TargetKind};
use tokio::sync::{Mutex, RwLock};

use crate::app_error::AppError;
use crate::hashes::{HashCache, HashCacheState};

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

#[tauri::command(async)]
async fn open_pocket(
    state: tauri::State<'_, PocketSyncState>,
    app_handle: tauri::AppHandle,
) -> Result<Option<String>, AppError> {
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
) -> Result<Option<String>, AppError> {
    debug!("Command: open_pocket_folder {pocket_path}");
    let window = app_handle.get_webview_window("main").unwrap();
    let pocket_path = PathBuf::from(pocket_path);

    info!("Adding {:?} to fs_scope", &pocket_path);
    app_handle.fs_scope().allow_directory(&pocket_path, true)?;

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
async fn clear_file_cache(app_handle: tauri::AppHandle) -> Result<(), AppError> {
    debug!("Command: clear_file_cache");
    if let Ok(cache_dir) = app_handle.path().app_cache_dir() {
        clear_file_caches(&cache_dir).await?
    }
    Ok(())
}

mod files_from_zip;

#[tauri::command(async)]
async fn check_root_files(
    state: tauri::State<'_, PocketSyncState>,
    extensions: Option<Vec<&str>>,
    hash_cache: tauri::State<'_, HashCacheState>,
) -> Result<Vec<RootFile>, AppError> {
    debug!("Command: check_root_files");
    let pocket_path = state.0.pocket_path.read().await;
    let hash_cache = hash_cache.inner();
    Ok(root_files::check_root_files(&pocket_path, extensions, hash_cache).await?)
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
    let app = tauri::Builder::default()
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
            commands::files::walkdir_list_files,
            commands::cores::uninstall_core,
            commands::archive::install_archive_files,
            commands::saves::backup_saves,
            commands::saves::list_backup_saves,
            commands::saves::list_saves_in_zip,
            commands::saves::list_saves_on_pocket,
            commands::saves::restore_save,
            commands::files::find_cleanable_files,
            commands::cores::list_instance_packageable_cores,
            commands::cores::run_packager_for_core,
            get_news_feed,
            begin_mister_sync_session,
            commands::files::get_file_metadata,
            commands::firmware::get_firmware_versions_list,
            commands::firmware::get_firmware_release_notes,
            commands::firmware::download_firmware,
            clear_file_cache,
            check_root_files,
            commands::archive::find_required_files,
            commands::files::save_multiple_files,
            get_active_jobs,
            stop_job,
            downconvert_all_pal_files,
            downconvert_single_pal_file,
            commands::files::find_mtime_for_files,
            move_game,
            commands::files::get_folder_size,
            commands::plugins::run_plugin,
            commands::plugins::list_and_install_plugins,
            commands::plugins::uninstall_plugin,
            commands::plugins::kill_plugin,
            commands::platforms::all_platform_data,
            commands::platforms::archive_unarchive_platforms,
            commands::platforms::all_platform_images
        ])
        .setup(|app| {
            log_panics::init();

            let cache_dir = app.path().app_cache_dir().expect("No cache dir");
            let cache_file = cache_dir.join("hash_cache.bin");

            let cache_data = if let Ok(data) = std::fs::read(&cache_file) {
                postcard::from_bytes(&data).unwrap_or_default()
            } else {
                HashCache::default()
            };

            app.manage(RwLock::new(cache_data));

            start_tasks(app)
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let RunEvent::Exit = event {
            let hash_cache = app_handle.state::<HashCacheState>();

            let cache = hash_cache.blocking_read();
            let cache_dir = app_handle.path().app_cache_dir().unwrap();
            let _ = std::fs::create_dir_all(&cache_dir);
            let cache_file = cache_dir.join("hash_cache.bin");
            let data = postcard::to_allocvec(&*cache).unwrap();
            let _ = std::fs::write(&cache_file, data);
        }
    })
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
