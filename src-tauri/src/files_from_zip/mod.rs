use std::{fs, io::Cursor, path::PathBuf};

use tempdir::TempDir;

pub async fn list_files(zip_path: &PathBuf) -> Result<Vec<String>, String> {
    let zip_path = zip_path.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let zip_file = fs::read(&zip_path).unwrap();
        let cursor = Cursor::new(zip_file);
        let archive = zip::ZipArchive::new(cursor).map_err(|err| err.to_string())?;

        Ok(archive
            .file_names()
            .map(|s| String::from(s))
            .filter(|s| !s.starts_with("."))
            .collect())
    })
    .await
    .map_err(|err| err.to_string())?
}

pub async fn copy_file_from_zip(
    zip_path: &PathBuf,
    file_name: &str,
    to: &PathBuf,
) -> Result<(), String> {
    let zip_path = zip_path.clone();
    let tmp_dir = TempDir::new("zip_tmp").map_err(|err| err.to_string())?;
    let tmp_path = tmp_dir.into_path();
    let tmp_path_clone = tmp_path.clone();
    let _result: Result<(), String> = tauri::async_runtime::spawn_blocking(move || {
        let zip_file = fs::read(&zip_path).map_err(|err| err.to_string())?;
        let cursor = Cursor::new(zip_file);
        let mut archive = zip::ZipArchive::new(cursor).map_err(|err| err.to_string())?;

        archive.extract(&tmp_path).map_err(|err| err.to_string())?;

        Ok(())
    })
    .await
    .map_err(|err| err.to_string())?;

    let tmp_file_path = tmp_path_clone.join(file_name);
    tokio::fs::copy(tmp_file_path, to)
        .await
        .map(|_| ())
        .map_err(|err| err.to_string())
}

pub async fn crc32_file_in_zip(zip_path: &PathBuf, file_name: &str) -> Result<u32, String> {
    let zip_path = zip_path.clone();
    let file_name = file_name.to_string();
    tauri::async_runtime::spawn_blocking(move || {
        let zip_file = fs::read(&zip_path).unwrap();
        let cursor = Cursor::new(zip_file);
        let mut archive = zip::ZipArchive::new(cursor).map_err(|err| err.to_string())?;

        let file = archive.by_name(&file_name).map_err(|err| err.to_string())?;
        let checksum = file.crc32();
        Ok(checksum)
    })
    .await
    .map_err(|err| err.to_string())?
}
