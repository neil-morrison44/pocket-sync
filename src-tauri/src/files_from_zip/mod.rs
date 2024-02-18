use crate::hashes::md5_for_file;
use anyhow::Result;
use std::{fs, io::Cursor, path::PathBuf};
use tempdir::TempDir;

pub async fn list_files(zip_path: &PathBuf) -> Result<Vec<String>> {
    let zip_path = zip_path.clone();
    let zip_file = tokio::fs::read(&zip_path).await?;
    tauri::async_runtime::spawn_blocking(move || {
        let cursor = Cursor::new(zip_file);
        let archive = zip::ZipArchive::new(cursor)?;

        Ok(archive
            .file_names()
            .map(|s| String::from(s))
            .filter(|s| !s.starts_with("."))
            .collect())
    })
    .await?
}

pub async fn copy_file_from_zip(zip_path: &PathBuf, file_name: &str, to: &PathBuf) -> Result<()> {
    let zip_path = zip_path.clone();
    let tmp_dir = TempDir::new("zip_tmp")?;
    let tmp_path = tmp_dir.into_path();
    let tmp_path_clone = tmp_path.clone();
    let _result: Result<(), anyhow::Error> = tauri::async_runtime::spawn_blocking(move || {
        let zip_file = fs::read(&zip_path)?;
        let cursor = Cursor::new(zip_file);
        let mut archive = zip::ZipArchive::new(cursor)?;

        archive.extract(&tmp_path)?;
        Ok(())
    })
    .await?;

    let tmp_file_path = tmp_path_clone.join(file_name);
    tokio::fs::copy(tmp_file_path, to).await?;
    Ok(())
}

pub async fn crc32_file_in_zip(zip_path: &PathBuf, file_name: &str) -> Result<u32> {
    let zip_path = zip_path.clone();
    let file_name = file_name.to_string();
    tauri::async_runtime::spawn_blocking(move || {
        let zip_file = fs::read(&zip_path).unwrap();
        let cursor = Cursor::new(zip_file);
        let mut archive = zip::ZipArchive::new(cursor)?;

        let file = archive.by_name(&file_name)?;
        let checksum = file.crc32();
        Ok(checksum)
    })
    .await?
}

pub async fn md5_file_in_zip(zip_path: &PathBuf, file_name: &str) -> Result<String> {
    let zip_path = zip_path.clone();
    let file_name = file_name.to_string();

    let tmp_dir = TempDir::new("zip_tmp")?;
    let tmp_path = tmp_dir.into_path();
    let tmp_path_clone = tmp_path.clone();
    let _result: Result<(), anyhow::Error> = tauri::async_runtime::spawn_blocking(move || {
        let zip_file = fs::read(&zip_path)?;
        let cursor = Cursor::new(zip_file);
        let mut archive = zip::ZipArchive::new(cursor)?;

        archive.extract(&tmp_path)?;
        Ok(())
    })
    .await?;

    let tmp_file_path = tmp_path_clone.join(file_name);

    md5_for_file(&tmp_file_path).await
}
