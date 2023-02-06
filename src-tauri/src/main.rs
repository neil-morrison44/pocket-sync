#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use checks::{check_if_folder_looks_like_pocket, start_connection_thread};
use clean_fs::find_dotfiles;
use futures_locks::RwLock;
use hashes::sha1_for_file;
use install_zip::start_zip_thread;
use saves_zip::{
    build_save_zip, read_save_zip_list, read_saves_in_folder, read_saves_in_zip,
    restore_save_from_zip, SaveZipFile,
};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs::{self};
use std::io::Read;
use std::io::Write;
use std::path::PathBuf;
use tauri::api::dialog;
use tauri::{App, Window};
use walkdir::{DirEntry, WalkDir};
mod checks;
mod clean_fs;
mod hashes;
mod install_zip;
mod saves_zip;
struct PocketSyncState(RwLock<PathBuf>);

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command(async)]
async fn open_pocket(state: tauri::State<'_, PocketSyncState>) -> Result<Option<String>, ()> {
    if let Some(pocket_path) = dialog::blocking::FileDialogBuilder::new().pick_folder() {
        if !check_if_folder_looks_like_pocket(&pocket_path) {
            return Ok(None);
        }

        let mut path_state = state.0.write().await;
        *path_state = pocket_path;

        Ok(Some(String::from(path_state.to_str().unwrap())))
    } else {
        Err(())
    }
}

#[tauri::command(async)]
async fn read_binary_file(
    state: tauri::State<'_, PocketSyncState>,
    path: &str,
) -> Result<Vec<u8>, ()> {
    let pocket_path = state.0.read().await;
    let path = pocket_path.join(path);

    let mut f = fs::File::open(&path).expect(&format!("no file found: {:?}", path));
    let metadata = fs::metadata(&path).expect("unable to read metadata");
    let mut buffer = vec![0; metadata.len() as usize];

    f.read(&mut buffer).expect("buffer overflow");

    Ok(buffer)
}

#[tauri::command(async)]
async fn read_text_file(
    state: tauri::State<'_, PocketSyncState>,
    path: &str,
) -> Result<String, ()> {
    let pocket_path = state.0.read().await;
    let path = pocket_path.join(path);
    // println!("reading text file: {:?}", &path);
    let file_contents = fs::read_to_string(path).unwrap();
    Ok(file_contents)
}

#[tauri::command(async)]
async fn file_exists(state: tauri::State<'_, PocketSyncState>, path: &str) -> Result<bool, ()> {
    let pocket_path = state.0.read().await;
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
    let pocket_path = state.0.read().await;
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
    let pocket_path = state.0.read().await;
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

    let walker = WalkDir::new(&dir_path).into_iter();
    let dir_path_str = &dir_path.to_str().unwrap();
    Ok(walker
        .filter_entry(|e| !is_hidden(e))
        .into_iter()
        .filter_map(|x| x.ok())
        .filter(|e| e.path().is_file())
        .map(|e| String::from(e.path().to_str().unwrap()))
        .filter(|s| extensions.len() == 0 || extensions.iter().any(|e| s.ends_with(e)))
        .map(|s| s.replace(dir_path_str, ""))
        .collect())
}

#[tauri::command(async)]
async fn uninstall_core(
    core_name: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    let pocket_path = state.0.write().await;
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
    // println!("installing archive files");
    let pocket_path = state.0.read().await;
    let file_count = files.len();

    let mut failed_already = HashSet::new();

    window
        .emit(
            "file-progress",
            FileProgressPayload {
                value: 0,
                max: file_count,
            },
        )
        .unwrap();

    for (index, file) in files.into_iter().enumerate() {
        let full_url = format!("{}/{}", archive_url, file.filename);

        // println!("Downloading from {full_url}");

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

                        let new_file_path = folder.join(file.filename);
                        let mut dest = fs::File::create(&new_file_path).unwrap();
                        let content = r.bytes().await.unwrap();
                        let mut content_cusror = std::io::Cursor::new(content);
                        std::io::copy(&mut content_cusror, &mut dest).unwrap();
                    }
                }
            }
        }

        window
            .emit(
                "file-progress",
                FileProgressPayload {
                    value: index + 1,
                    max: file_count,
                },
            )
            .unwrap();
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
    let pocket_path = state.0.read().await;
    build_save_zip(&pocket_path, save_paths, zip_path, max_count).unwrap();

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

    let files = read_save_zip_list(&path).unwrap();

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

    read_saves_in_zip(&path)
}

#[tauri::command(async)]
async fn list_saves_on_pocket(
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<SaveZipFile>, ()> {
    let pocket_path = state.0.read().await;
    let saves_path = pocket_path.join("Saves");
    read_saves_in_folder(&saves_path)
}

#[tauri::command(async)]
async fn restore_save(
    zip_path: &str,
    file_path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<(), ()> {
    let pocket_path = state.0.read().await;
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
    let pocket_path = state.0.read().await;
    for path in paths {
        let file_path = pocket_path.join(path);
        if file_path.exists() {
            fs::remove_file(file_path).unwrap()
        }
    }
    Ok(true)
}

#[tauri::command(async)]
async fn find_cleanable_files(
    path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, String> {
    let pocket_path = state.0.read().await;
    let root_path = pocket_path.join(path);
    let files = find_dotfiles(&root_path).unwrap();

    Ok(files)
}

#[tauri::command(async)]
async fn file_sha1_hash(
    state: tauri::State<'_, PocketSyncState>,
    path: &str,
) -> Result<String, ()> {
    let pocket_path = state.0.read().await;
    let path = pocket_path.join(path);

    if !path.exists() {
        return Ok(String::from(""));
    }

    if let Ok(hash) = sha1_for_file(&path) {
        return Ok(hash);
    } else {
        return Ok(String::from(""));
    }
}

#[tauri::command]
async fn list_instance_packageable_cores(
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    let pocket_path = state.0.read().await;
    Ok(instance_packager::find_cores_with_package_json(&pocket_path).unwrap())
}

#[tauri::command]
async fn run_packager_for_core(
    state: tauri::State<'_, PocketSyncState>,
    core_name: &str,
    window: Window,
) -> Result<(), ()> {
    let pocket_path = state.0.read().await;

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
        |file_name| {
            emit_event(String::from(file_name), true, None);
        },
        |file_name, message| {
            emit_event(String::from(file_name), false, Some(String::from(message)));
        },
    )
    .unwrap())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .manage(PocketSyncState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            open_pocket,
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
            file_sha1_hash,
            list_instance_packageable_cores,
            run_packager_for_core
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
