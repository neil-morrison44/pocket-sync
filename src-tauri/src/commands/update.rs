use crate::PocketSyncState;
use crate::app_error::AppError;
use crate::commands::archive::ProgressUpdate;
use crate::hashes::HashCacheState;
use crate::install_files::install_file;
use crate::required_files::ArchiveInfo;
use crate::required_files::DataSlotFile;
use crate::required_files::DataSlotFileStatus;
use crate::required_files::required_files_for_core;
use futures::future::join_all;
use log::{debug, error};
use reqwest::Client;
use serde::Deserialize;
use serde::Serialize;
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use tauri::Emitter;
use tauri::Listener;
use tauri::Window;
use tokio::sync::Semaphore;
use tokio::sync::mpsc;
use tokio::time::Instant;

#[derive(Deserialize, Debug)]
struct InventoryJSON {
    data: Vec<InventoryItem>,
}

#[derive(Deserialize, Debug)]
struct InventoryItem {
    id: String,
    #[serde(default)]
    releases: Vec<Release>,
}

#[derive(Deserialize, Debug)]
struct Release {
    download_url: String,
}

#[derive(Deserialize, Default, Debug)]
pub struct UpdateOptions {
    retain_platform_files: bool,
    archive_url: Option<String>,
    include_alternate_files: bool,
    fast_downloads: bool,
}

#[derive(Deserialize, Serialize, Debug, Clone, Copy)]
pub enum CoreDownloadType {
    Update,
    Install,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub enum PhaseOneErrorType {
    GithubRateLimit,
    Other,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub enum PhaseThreeErrorType {
    Network,
    FileSystem,
    Other,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum UpdateEvent {
    PhaseZeroStartedEvent,
    PhaseOneStartedEvent,
    PhaseOneCoreDownloadProgressEvent {
        core_name: String,
        download_progress: f32,
        core_index: u32,
        total_core_count: u32,
        download_type: CoreDownloadType,
    },
    PhaseOneErrorEvent {
        error: PhaseOneErrorType,
    },
    PhaseTwoStartedEvent,
    PhaseTwoProgressEvent {
        processed_cores: u32,
        total_cores: u32,
    },
    PhaseThreeStartedEvent,
    PhaseThreeDownloadProgressEvent {
        core_name: String,
        file_name: String,
        download_progress: f32,
        file_index: u32,
        file_index_for_core: u32,
        total_core_count: u32,
        total_core_count_for_core: u32,
        elapsed_time: u64,
        elapsed_bytes: u64,
    },
    PhaseThreeErrorEvent {
        error: PhaseThreeErrorType,
    },
    Finish {
        updated_cores: Vec<String>,
        installed_cores: Vec<String>,
        installed_files_per_core: HashMap<String, Vec<String>>,
        total_time: u64,
    },
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(tag = "type")]
enum SkipEventPayload {
    Core(String),
    File,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
struct FileDownloadTicket {
    core_name: String,
    file_status: DataSlotFile,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
struct CoreDownloadTicket {
    core_name: String,
    download_url: String,
    download_type: CoreDownloadType,
}

#[tauri::command(async)]
pub async fn install_and_update_cores(
    state: tauri::State<'_, PocketSyncState>,
    hash_cache: tauri::State<'_, HashCacheState>,
    window: Window,
    update_list: Vec<&str>,
    install_list: Vec<&str>,
    options: UpdateOptions,
) -> Result<(), AppError> {
    debug!("Command: install_and_update_cores");
    let client = Client::new();
    let start_time = std::time::Instant::now();
    let pocket_path = state.0.pocket_path.read().await;

    window.emit("pocket-fs-pause", true)?;

    // Phase 0: request https://openfpga-library.github.io/analogue-pocket/api/v3/cores.json
    // use the update_list & install_list to compose 2 lists of core -> github URL
    window.emit(
        "install_and_update_cores::update_event",
        UpdateEvent::PhaseZeroStartedEvent,
    )?;

    let library_url = "https://openfpga-library.github.io/analogue-pocket/api/v3/cores.json";
    let inventory: InventoryJSON = client.get(library_url).send().await?.json().await?;
    let mut core_download_tickets: Vec<CoreDownloadTicket> = Vec::new();

    let tasks = [
        (&update_list, CoreDownloadType::Update),
        (&install_list, CoreDownloadType::Install),
    ];

    for (list, download_type) in tasks {
        let tickets = list.iter().filter_map(|core_name| {
            let release = inventory
                .data
                .iter()
                .find(|i| &i.id == core_name)?
                .releases
                .first()?;

            Some(CoreDownloadTicket {
                core_name: core_name.to_string(),
                download_url: release.download_url.clone(),
                download_type,
            })
        });

        core_download_tickets.extend(tickets);
    }

    let total_phase_one = core_download_tickets.len() as u32;

    // Phase 1: Loop over the update list installing the new versions over the old ones,
    // paying attention to the `retain_platform_files` option,
    // then loop over the install list (which doesn't have to pay attention to the `retain_platform_files` option)
    // emit PhaseOneCoreDownloadProgressEvent as we go with `PhaseOneCoreDownloadProgressEvent` from 0.0 to 1.0.
    // if an error occurs emit a `PhaseOneErrorEvent` and continue on to the next Phase with whatever we've managed to install
    window.emit(
        "install_and_update_cores::update_event",
        UpdateEvent::PhaseOneStartedEvent,
    )?;

    let mut successfully_updated = Vec::new();
    let mut successfully_installed = Vec::new();

    for (core_index, core_download_ticket) in core_download_tickets.into_iter().enumerate() {
        let core_index = core_index as u32;
        match download_and_extract_core(
            &client,
            &window,
            &core_download_ticket,
            &pocket_path,
            &options,
            core_index,
            total_phase_one,
        )
        .await
        {
            Ok(()) => match core_download_ticket.download_type {
                CoreDownloadType::Install => {
                    successfully_installed.push(core_download_ticket.core_name.clone())
                }
                CoreDownloadType::Update => {
                    successfully_updated.push(core_download_ticket.core_name.clone())
                }
            },
            Err(e) => {
                error!(
                    "Phase 1 Error for {}: {:?}",
                    core_download_ticket.core_name, e
                );
                let err_type = if e.to_string().contains("rate limit") {
                    PhaseOneErrorType::GithubRateLimit
                } else {
                    PhaseOneErrorType::Other
                };
                window.emit(
                    "install_and_update_cores::update_event",
                    UpdateEvent::PhaseOneErrorEvent { error: err_type },
                )?;
            }
        }
    }

    dbg!(&successfully_updated);
    dbg!(&successfully_installed);

    // Phase 2: if there's no archive_url set then exit & finish at this phase,
    // if there is an archive url then use it to request the archive.org metadata page,
    // then (and break this up to run on multiple cores) look at the  updated & installed cores
    // (only ones actually installed in phase 1)
    // and begin working out what files of theirs need downloaded
    // either it's missing entirely or it's there but has a hash that doesn't match the one in the
    // archive.org metadata.
    // the end result should be a list of `FileDownloadTickets`
    window.emit(
        "install_and_update_cores::update_event",
        UpdateEvent::PhaseTwoStartedEvent,
    )?;

    let mut file_download_tickets: Vec<FileDownloadTicket> = Vec::new();

    if let Some(archive_url) = &options.archive_url {
        let mut metadata_url = archive_url.replace("download", "metadata");
        if metadata_url.contains("updater.") {
            metadata_url = metadata_url + "/updater.php"
        }

        let all_successful_cores = successfully_updated
            .iter()
            .cloned()
            .chain(successfully_installed.iter().cloned())
            .collect::<Vec<_>>();

        let semaphore = Arc::new(Semaphore::new(10));
        let mut check_tasks = Vec::new();

        for core_name in all_successful_cores {
            let permit = semaphore.clone().acquire_owned().await?;
            let pocket_path_clone = pocket_path.clone();
            let metadata_url_clone = metadata_url.clone();
            let window_clone = window.clone();
            let hash_cache_clone = hash_cache.inner().clone();
            let include_alternate_files = options.include_alternate_files;

            check_tasks.push(tokio::spawn(async move {
                let _permit = permit;

                match required_files_for_core(
                    &core_name,
                    &pocket_path_clone,
                    include_alternate_files,
                    &metadata_url_clone,
                    window_clone,
                    hash_cache_clone,
                )
                .await
                {
                    Ok(data_slot_files) => data_slot_files
                        .into_iter()
                        .filter_map(|data_slot_file| match data_slot_file.status {
                            DataSlotFileStatus::NeedsUpdateFromArchive(_)
                            | DataSlotFileStatus::MissingButOnArchive(_)
                            | DataSlotFileStatus::FoundAtRoot { .. } => Some(FileDownloadTicket {
                                core_name: core_name.clone(),
                                file_status: data_slot_file.clone(),
                            }),
                            _ => None,
                        })
                        .collect(),
                    Err(e) => {
                        error!("{}", e);
                        return vec![];
                    }
                }
            }))
        }

        file_download_tickets.extend(
            join_all(check_tasks)
                .await
                .into_iter()
                .filter_map(|t| t.ok())
                .flatten(),
        );
    }

    // Phase 3: this should not be multithreaded, work through the list of FileDownloadTickets from phase 2,
    // emitting the relevant phase 3 events so progress bars and the UI can be kept updated
    window.emit(
        "install_and_update_cores::update_event",
        UpdateEvent::PhaseThreeStartedEvent,
    )?;

    let mut skipped_cores: Vec<String> = vec![];
    let cancel_current_download = Arc::new(AtomicBool::new(false));

    // setup listener on "install_and_update_cores::skip_event"
    // which can either skip the current core or the current file
    //
    // also setup progress_tx which emits `PhaseThreeDownloadProgressEvent` to the window
    //
    //

    let (skip_tx, mut skip_rx) = mpsc::unbounded_channel::<SkipEventPayload>();
    let cancel_for_listener = cancel_current_download.clone();

    window.listen("install_and_update_cores::skip_event", move |event| {
        if let Ok(payload) = serde_json::from_str::<SkipEventPayload>(&event.payload()) {
            cancel_for_listener.store(true, Ordering::Relaxed);
            let _ = skip_tx.send(payload);
        }
    });

    if let Some(archive_url) = &options.archive_url {
        let cancel_for_loop = cancel_current_download.clone();

        for (file_index, file_download_ticket) in file_download_tickets.iter().enumerate() {
            while let Ok(skip_payload) = skip_rx.try_recv() {
                match skip_payload {
                    SkipEventPayload::Core(core_name) => skipped_cores.push(core_name),
                    _ => {}
                }
            }

            cancel_for_loop.store(false, Ordering::Relaxed);
            if skipped_cores.contains(&file_download_ticket.core_name) {
                continue;
            }

            let (progress_tx, mut progress_rx) = mpsc::unbounded_channel::<ProgressUpdate>();
            let window_clone = window.clone();

            let core_name = file_download_ticket.core_name.clone();
            let file_name = file_download_ticket.file_status.name.clone();
            let file_bytes = match &file_download_ticket.file_status.status {
                DataSlotFileStatus::MissingButOnArchive(ArchiveInfo {
                    size: Some(bytes), ..
                })
                | DataSlotFileStatus::NeedsUpdateFromArchive(ArchiveInfo {
                    size: Some(bytes),
                    ..
                }) => bytes.parse::<u64>().unwrap_or(0),
                _ => 0,
            };

            tokio::spawn(async move {
                let start_time = Instant::now();
                let mut elapsed_bytes = 0;

                // This while loop naturally exits when `install_file` finishes and drops `progress_tx`
                while let Some(ProgressUpdate::AddBytes(bytes)) = progress_rx.recv().await {
                    elapsed_bytes += bytes as u64;

                    let event = UpdateEvent::PhaseThreeDownloadProgressEvent {
                        core_name: core_name.clone(),
                        file_name: file_name.clone(),
                        download_progress: (elapsed_bytes as f64 / file_bytes as f64) as f32,
                        file_index: file_index as u32,
                        file_index_for_core: 0,       // Retrieve from ticket
                        total_core_count: 0,          // Retrieve from ticket
                        total_core_count_for_core: 0, // Retrieve from ticket
                        elapsed_time: start_time.elapsed().as_secs(),
                        elapsed_bytes,
                    };

                    let _ = window_clone.emit("phase_three_download_progress", event);
                }
            });

            install_file(
                &file_download_ticket.file_status,
                &archive_url,
                options.fast_downloads,
                &pocket_path,
                progress_tx,
                cancel_current_download,
            )
            .await;
        }
    }

    // Finish: emit a Finish event with the stats

    window.emit("pocket-fs-pause", false)?;

    Ok(())
}

async fn download_and_extract_core(
    client: &Client,
    window: &Window,
    ticket: &CoreDownloadTicket,
    pocket_path: &Path,
    options: &UpdateOptions,
    core_index: u32,
    total_cores: u32,
) -> anyhow::Result<()> {
    let core_name = ticket.core_name.clone();
    let download_type = ticket.download_type;

    let mut res = client
        .get(&ticket.download_url)
        .send()
        .await?
        .error_for_status()?;
    let total_size = res.content_length().unwrap_or(0) as f32;
    let mut downloaded: f32 = 0.0;
    let mut zip_bytes = Vec::with_capacity(total_size as usize);

    window.emit(
        "install_and_update_cores::update_event",
        UpdateEvent::PhaseOneCoreDownloadProgressEvent {
            core_name: core_name.to_string(),
            download_progress: 0.0,
            core_index,
            total_core_count: total_cores,
            download_type: download_type.clone(),
        },
    )?;

    while let Some(chunk) = res.chunk().await? {
        zip_bytes.extend_from_slice(&chunk);
        downloaded += chunk.len() as f32;

        if total_size > 0.0 {
            window.emit(
                "install_and_update_cores::update_event",
                UpdateEvent::PhaseOneCoreDownloadProgressEvent {
                    core_name: core_name.to_string(),
                    download_progress: downloaded / total_size,
                    core_index,
                    total_core_count: total_cores,
                    download_type: download_type.clone(),
                },
            )?;
        }
    }

    let pocket_path_clone = pocket_path.to_path_buf();
    let retain_platform_files = options.retain_platform_files;
    let is_update = matches!(download_type, CoreDownloadType::Update);

    tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
        let cursor = std::io::Cursor::new(zip_bytes);
        let mut archive = zip::ZipArchive::new(cursor)?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let outpath = pocket_path_clone.join(file.mangled_name());

            if skip_file(&outpath, &pocket_path_clone) {
                continue;
            }

            if file.name().ends_with('/') {
                std::fs::create_dir_all(&outpath)?;
            } else {
                if let Some(p) = outpath.parent() {
                    if !p.exists() {
                        std::fs::create_dir_all(p)?;
                    }
                }

                if is_update && retain_platform_files {
                    if file.name().starts_with("Platforms/") && outpath.exists() {
                        continue;
                    }
                }

                let mut outfile = std::fs::File::create(&outpath)?;
                std::io::copy(&mut file, &mut outfile)?;
            }
        }
        Ok(())
    })
    .await??;

    Ok(())
}

fn skip_file(path: &Path, pocket_path: &Path) -> bool {
    let Ok(rel_path) = path.strip_prefix(pocket_path) else {
        return true;
    };

    let rel_str = rel_path.to_string_lossy();
    if rel_str.contains("__MACOSX") || rel_str.contains(".DS_Store") {
        return true;
    }
    if rel_path
        .file_name()
        .is_some_and(|name| name.to_string_lossy().starts_with('.'))
    {
        return true;
    }
    let Some(first_component) = rel_path.components().next() else {
        return true;
    };
    let top_dir = first_component.as_os_str().to_string_lossy().to_lowercase();
    let is_allowed = matches!(
        top_dir.as_str(),
        "assets" | "settings" | "cores" | "presets" | "platforms"
    );
    !is_allowed
}
