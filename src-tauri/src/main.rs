#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::io::Read;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::api::dialog;

struct PocketSyncState(Mutex<PathBuf>);

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command(async)]
fn open_pocket(state: tauri::State<PocketSyncState>) -> Result<String, ()> {
    if let Some(pocket_path) = dialog::blocking::FileDialogBuilder::new().pick_folder() {
        let mut path_state = state.0.lock().unwrap();
        *path_state = pocket_path;

        Ok(format!("path: {:?}", &path_state))
    } else {
        Err(())
    }
}

#[tauri::command(async)]
fn get_screenshot(state: tauri::State<PocketSyncState>, file_name: &str) -> Result<Vec<u8>, ()> {
    let pocket_path = state.0.lock().unwrap();
    let path = pocket_path.join("Memories/Screenshots").join(file_name);

    let mut f = fs::File::open(&path).expect("no file found");
    let metadata = fs::metadata(&path).expect("unable to read metadata");
    let mut buffer = vec![0; metadata.len() as usize];

    f.read(&mut buffer).expect("buffer overflow");
    let compressed = deflate::deflate_bytes(&buffer);

    Ok(compressed)
}

#[tauri::command(async)]
fn list_screenshots(state: tauri::State<PocketSyncState>) -> Result<Vec<String>, ()> {
    let pocket_path = state.0.lock().unwrap();
    let screenshots_path = pocket_path.join("Memories/Screenshots");

    let paths = fs::read_dir(screenshots_path).unwrap();

    Ok(paths
        .into_iter()
        .filter(Result::is_ok)
        .map(|p| p.unwrap())
        .map(|p| p.file_name().into_string().unwrap())
        .filter(|s| !s.starts_with("."))
        .collect())
}

fn main() {
    tauri::Builder::default()
        .manage(PocketSyncState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            open_pocket,
            list_screenshots,
            get_screenshot
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
