#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use futures::lock::Mutex;
use reqwest::StatusCode;
use std::fs::{self};
use std::io::Read;
use std::io::{Cursor, Write};
use std::path::PathBuf;
use tauri::api::dialog;

struct PocketSyncState(Mutex<PathBuf>);

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command(async)]
async fn open_pocket(state: tauri::State<'_, PocketSyncState>) -> Result<String, ()> {
    if let Some(pocket_path) = dialog::blocking::FileDialogBuilder::new().pick_folder() {
        let mut path_state = state.0.lock().await;
        *path_state = pocket_path;

        Ok(format!("path: {:?}", &path_state))
    } else {
        Err(())
    }
}

#[tauri::command(async)]
async fn read_binary_file(
    state: tauri::State<'_, PocketSyncState>,
    path: &str,
) -> Result<Vec<u8>, ()> {
    let pocket_path = state.0.lock().await;
    let path = pocket_path.join(path);

    let mut f = fs::File::open(&path).expect("no file found");
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
    let pocket_path = state.0.lock().await;
    let path = pocket_path.join(path);
    let video_json = fs::read_to_string(path).unwrap();
    Ok(video_json)
}

#[tauri::command(async)]
fn save_file(path: &str, buffer: Vec<u8>) -> Result<bool, ()> {
    let file_path = PathBuf::from(path);
    let mut file = fs::File::create(file_path).unwrap();

    file.write_all(&buffer).unwrap();

    Ok(true)
}

#[tauri::command(async)]
async fn list_files(
    path: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<Vec<String>, ()> {
    let pocket_path = state.0.lock().await;
    let dir_path = pocket_path.join(path);
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
async fn install_core(
    core_name: &str,
    zip_url: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<String, ()> {
    // could add funcionality here to limit zip files to _just_ the Cores/Assets/Platforms
    // folders we want to allow them to change
    // or prevent them from changing existing platform images etc
    let response = reqwest::get(zip_url).await.unwrap();
    let pocket_path = state.0.lock().await;

    match response.status() {
        StatusCode::OK => {
            let zip_file = response.bytes().await.unwrap();
            let cursor = Cursor::new(zip_file);
            let mut archive = zip::ZipArchive::new(cursor).unwrap();
            archive.extract(pocket_path.as_path()).unwrap();
            Ok(String::from("200"))
        }
        s => Ok(String::from(s.as_str())),
    }
}

#[tauri::command(async)]
async fn uninstall_core(
    core_name: &str,
    state: tauri::State<'_, PocketSyncState>,
) -> Result<bool, ()> {
    let pocket_path = state.0.lock().await;
    let core_path = pocket_path.join("Cores").join(core_name);
    println!("I will remove {:?}", &core_path);
    if core_path.exists() && core_path.is_dir() {
        // not sure why this doesn't work
        // fs::remove_dir_all(core_path).unwrap();

        if let Ok(entries) = std::fs::read_dir(&core_path) {
            for entry in entries {
                let path = entry.unwrap().path();
                println!("{:?}", path);

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

fn main() {
    tauri::Builder::default()
        .manage(PocketSyncState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            open_pocket,
            list_files,
            read_binary_file,
            read_text_file,
            save_file,
            install_core,
            uninstall_core
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
