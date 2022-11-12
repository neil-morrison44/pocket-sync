#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::io::{Read, Write};
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

    Ok(buffer)
}

#[tauri::command(async)]
fn get_video_json(
    state: tauri::State<PocketSyncState>,
    author_name: &str,
    core_name: &str,
) -> Result<String, ()> {
    let pocket_path = state.0.lock().unwrap();
    let path = pocket_path
        .join("Cores")
        .join(format!("{}.{}", author_name, core_name))
        .join("video.json");

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
            get_screenshot,
            get_video_json,
            save_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
