use crate::{
    PocketSyncState,
    app_error::AppError,
    hashes::HashCacheState,
    install_files::install_file,
    progress,
    required_files::{DataSlotFile, DataSlotFileStatus, required_files_for_core},
    util::find_common_path,
};
use log::{debug, error};
use std::path::PathBuf;
use tauri::{Emitter, Window};
use tokio::sync::mpsc;

#[tauri::command(async)]
pub async fn find_required_files(
    state: tauri::State<'_, PocketSyncState>,
    hash_cache: tauri::State<'_, HashCacheState>,
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

    Ok(required_files_for_core(
        core_id,
        &pocket_path,
        include_alts,
        archive_url,
        window,
        hash_cache.inner(),
    )
    .await?)
}

pub enum ProgressUpdate {
    AddBytes(usize),
    SetMessage(String, String),
}

#[tauri::command(async)]
pub async fn install_archive_files(
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

    let mut total_bytes: usize = 0;
    for file in &files {
        match &file.status {
            DataSlotFileStatus::NeedsUpdateFromArchive(info)
            | DataSlotFileStatus::MissingButOnArchive(info) => {
                if let Some(size_str) = &info.size {
                    total_bytes += size_str.parse::<usize>().unwrap_or(0);
                }
            }
            _ => {}
        }
    }

    let (progress_tx, mut progress_rx) = mpsc::unbounded_channel::<ProgressUpdate>();
    let window_clone = window.clone();
    let job_id_clone = job_id.to_string();

    tokio::spawn(async move {
        let mut progress = progress::ProgressEmitter::new(Box::new(move |event| {
            let _ = window_clone.emit(&format!("progress-event::{job_id_clone}"), event);
        }));

        progress.begin_work_units(total_bytes.max(1)); // Avoid 0-byte division

        while let Some(msg) = progress_rx.recv().await {
            match msg {
                ProgressUpdate::AddBytes(bytes) => progress.complete_work_units(bytes),
                ProgressUpdate::SetMessage(action, file) => {
                    progress.set_message(&action, Some(&file))
                }
            }
        }
    });

    for file in files {
        if !job_handle.is_alive().await {
            break;
        }
        let _ = progress_tx.send(ProgressUpdate::SetMessage(
            "downloading".into(),
            file.name.clone(),
        ));

        let file_name = file.name.clone();

        if let Err(err) = install_file(
            file,
            archive_url,
            turbo,
            &pocket_path,
            progress_tx.clone(),
            job_handle.cancel_token(),
        )
        .await
        {
            error!("Error: {} download file {}", err, &file_name);
        };
    }

    Ok(true)
}
