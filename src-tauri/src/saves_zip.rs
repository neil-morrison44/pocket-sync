use async_walkdir::WalkDir;
use futures::{future::join_all, StreamExt};
use serde::{Deserialize, Serialize};
use std::{
    cmp::{Ord, Ordering},
    error,
    fs::{self, File},
    io::{Cursor, Read, Write},
    path::{Path, PathBuf},
    time::SystemTime,
};
use tempdir::TempDir;
use zip::{result::ZipError, write::FileOptions, DateTime};

use crate::hashes::crc32_for_file;

#[derive(Eq, PartialEq, PartialOrd, Serialize, Deserialize, Debug)]
pub struct SaveZipFile {
    last_modified: u32,
    crc32: u32,
    filename: String,
}

impl Ord for SaveZipFile {
    fn cmp(&self, other: &Self) -> Ordering {
        self.last_modified.cmp(&other.last_modified)
    }
}

static FILE_PREFIX: &str = "pocket-sync-save-backup__";

pub async fn restore_save_from_zip(
    zip_path: &PathBuf,
    file_path: &str,
    pocket_path: &PathBuf,
) -> () {
    let zip_file = tokio::fs::read(zip_path).await.unwrap();
    let cursor = Cursor::new(zip_file);
    let mut archive = zip::ZipArchive::new(cursor).unwrap();

    let tmp_dir = TempDir::new("zip_saves_tmp").unwrap();
    let tmp_path = tmp_dir.into_path();

    let tmp_path_clone = tmp_path.clone();
    tokio::task::spawn_blocking(move || {
        archive.extract(&tmp_path_clone).unwrap();
    })
    .await
    .unwrap();

    let src_file_path = tmp_path.join(remove_leading_slash(file_path));
    let dest_file_path = pocket_path
        .join("Saves")
        .join(remove_leading_slash(file_path));

    // println!("from {:?} to {:?}", src_file_path, dest_file_path);

    tokio::fs::create_dir_all(dest_file_path.parent().unwrap())
        .await
        .unwrap();
    tokio::fs::copy(&src_file_path, &dest_file_path)
        .await
        .unwrap();
}

pub async fn read_saves_in_zip(zip_path: &PathBuf) -> Result<Vec<SaveZipFile>, ()> {
    let zip_file = tokio::fs::read(zip_path).await.unwrap();
    let cursor = Cursor::new(zip_file);

    match zip::ZipArchive::new(cursor) {
        Ok(archive) => {
            let mut archive = archive;
            let tmp_dir = TempDir::new("zip_saves_tmp").unwrap();
            let tmp_path = tmp_dir.into_path();

            let tmp_path_clone = tmp_path.clone();
            tokio::task::spawn_blocking(move || {
                archive.extract(&tmp_path_clone).unwrap();
            })
            .await
            .unwrap();

            read_saves_in_folder(&tmp_path).await
        }
        Err(ZipError::InvalidArchive(_)) => {
            tokio::fs::remove_file(&zip_path).await.unwrap();
            Ok(vec![])
        }
        Err(_) => Ok(vec![]),
    }
}

pub async fn read_saves_in_folder(folder_path: &PathBuf) -> Result<Vec<SaveZipFile>, ()> {
    let mut walker = WalkDir::new(&folder_path);
    let mut tasks: Vec<_> = Vec::new();

    while let Some(Ok(entry)) = walker.next().await {
        match entry.file_type().await {
            Ok(f) => {
                if f.is_file() {
                    let file_path = entry.path().to_owned();
                    let folder_path_clone = folder_path.clone();

                    let task = tokio::spawn(async move {
                        let metadata = tokio::fs::metadata(&file_path).await.unwrap();
                        let last_modified = time::OffsetDateTime::from(metadata.created().unwrap());
                        let crc32 = crc32_for_file(&file_path).await.unwrap();
                        let folder_path_str = folder_path_clone.to_str().unwrap();

                        SaveZipFile {
                            filename: String::from(file_path.to_str().unwrap())
                                .replace(&folder_path_str, ""),
                            last_modified: last_modified.unix_timestamp().try_into().unwrap(),
                            crc32,
                        }
                    });

                    tasks.push(task);
                }
            }
            Err(_) => continue,
        }
    }

    let results: Vec<SaveZipFile> = join_all(tasks)
        .await
        .into_iter()
        .filter_map(Result::ok)
        .collect();

    return Ok(results);
}

pub async fn read_save_zip_list(dir_path: &PathBuf) -> Result<Vec<SaveZipFile>, ()> {
    if !dir_path.exists() {
        return Ok(vec![]);
    }
    let mut paths = tokio::fs::read_dir(dir_path).await.unwrap();
    let mut results: Vec<_> = Vec::new();

    while let Ok(Some(entry)) = paths.next_entry().await {
        let file_name = entry.file_name().into_string().unwrap();
        if !file_name.contains(FILE_PREFIX) {
            continue;
        }

        let file_path = dir_path.join(&file_name);
        let metadata = file_path.metadata().unwrap();
        let last_modified = time::OffsetDateTime::from(metadata.modified().unwrap());

        let crc32 = crc32_for_file(&file_path.into()).await.unwrap();

        results.push(SaveZipFile {
            filename: file_name,
            last_modified: last_modified.unix_timestamp().try_into().unwrap(),
            crc32,
        });
    }

    Ok(results)
}

pub async fn build_save_zip(
    pocket_path: &PathBuf,
    save_paths: Vec<&str>,
    dir_path: &str,
    max_count: usize,
) -> Result<(), ()> {
    let zip_path = Path::new(dir_path);
    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let filename = format!("{FILE_PREFIX}{timestamp}.zip");
    let zip_file_path = zip_path.join(filename);
    let zip_file = File::create(zip_file_path).unwrap();

    let mut zip = zip::ZipWriter::new(zip_file);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    let saves_path = pocket_path.join("Saves");

    let mut buffer = Vec::new();
    dbg!(&save_paths);
    for name in save_paths {
        let safe_name = remove_leading_slash(name);
        let path = saves_path.join(&safe_name);
        if let Ok(metadata) = path.metadata() {
            let last_modified = time::OffsetDateTime::from(metadata.modified().unwrap());

            let file_options = options.last_modified_time(
                DateTime::from_date_and_time(
                    last_modified.year().try_into().unwrap(),
                    last_modified.month().try_into().unwrap(),
                    last_modified.day(),
                    last_modified.hour(),
                    last_modified.minute(),
                    last_modified.second(),
                )
                .unwrap(),
            );

            if path.is_file() {
                zip.start_file(&safe_name, file_options).unwrap();
                let mut f = File::open(path).unwrap();
                f.read_to_end(&mut buffer).unwrap();
                zip.write_all(&*buffer).unwrap();
                buffer.clear();
            } else {
                zip.add_directory(&safe_name, options).unwrap();
            }
        } else {
            println!("Save path not found");
            dbg!(&path);
        }
    }
    zip.finish().unwrap();

    prune_zips(&zip_path, max_count).await.unwrap();
    Ok(())
}

async fn prune_zips(zip_path: &Path, max_count: usize) -> Result<(), Box<dyn error::Error>> {
    let mut files = read_save_zip_list(&PathBuf::from(zip_path)).await.unwrap();
    files.sort();
    let last_two: Vec<&SaveZipFile> = files.iter().rev().take(2).collect();
    if last_two.len() == 2 {
        if last_two[0].crc32 == last_two[1].crc32 {
            let newest_file_path = zip_path.join(&last_two[1].filename);
            fs::remove_file(newest_file_path)?;
        }
    }

    let files = read_save_zip_list(&PathBuf::from(zip_path)).await.unwrap();
    if files.len() > max_count {
        if let Some(oldest_file) = files.iter().min() {
            let last_file_path = zip_path.join(&oldest_file.filename);
            fs::remove_file(last_file_path)?;
        }
    }

    Ok(())
}

pub fn remove_leading_slash(value: &str) -> String {
    let mut result = String::new();
    let mut chars = value.chars();

    while let Some(c) = chars.next() {
        if !(c == '/' || c == '\\') {
            result.push(c);
            break;
        }
    }

    result.push_str(chars.as_str());
    result
}
