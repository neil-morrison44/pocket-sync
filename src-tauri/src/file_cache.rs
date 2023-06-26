use futures_locks::RwLock;
use serde::{Deserialize, Serialize};
use std::{
    error::Error,
    fs::create_dir,
    path::{Path, PathBuf},
    time::SystemTime,
};
use tauri::api::path::app_cache_dir;
use tokio::{fs::File, io};
use uuid::Uuid;

use crate::file_cache;

#[derive(Serialize, Deserialize)]
pub struct CacheRecord {
    path: PathBuf,
    modified: SystemTime,
    cache_path: Option<PathBuf>,
}

pub async fn get_file_with_cache(
    path: &PathBuf,
    cached_items: &RwLock<Vec<CacheRecord>>,
    cache_dir: &PathBuf,
) -> io::Result<File> {
    let file = tokio::fs::File::open(&path).await?;
    let metadata = file.metadata().await?;
    if let (Ok(modified), length) = (&metadata.modified(), &metadata.len()) {
        dbg!(modified);
        dbg!(length);
        if *length > 1000 {
            println!("Will try to cache");
            let cache_path = if let Some(existing_config_path) =
                find_in_cache(&path.into(), &modified, &cached_items).await
            {
                Some(existing_config_path)
            } else {
                write_to_cache(path, modified, cached_items, cache_dir)
                    .await
                    .ok()
            };

            if let Some(cache_path) = cache_path {
                let cached_file = tokio::fs::File::open(&cache_path).await?;
                return Ok(cached_file);
            }
        }
    }

    Ok(file)
}

async fn find_in_cache(
    path: &PathBuf,
    modified: &SystemTime,
    cached_items: &RwLock<Vec<CacheRecord>>,
) -> Option<PathBuf> {
    let items = cached_items.read().await;

    items
        .iter()
        .find(|cr| cr.modified == *modified && cr.path == *path)
        .and_then(|cr| cr.cache_path.clone())
}

async fn write_to_cache(
    path: &PathBuf,
    modified: &SystemTime,
    cached_items: &RwLock<Vec<CacheRecord>>,
    cache_dir: &PathBuf,
) -> Result<PathBuf, ()> {
    let id = Uuid::new_v4();

    let file_cache_dir = cache_dir.join("file_caches");
    if !file_cache_dir.exists() {
        create_dir(&file_cache_dir).expect("Failed to create cache directory");
    }
    let cache_path = file_cache_dir.join(format!("{id}.bin"));
    dbg!(&path, &cache_path);
    if let Ok(_) = tokio::fs::copy(path, &cache_path).await {
        println!("wrote file?");
        let mut items = cached_items.write().await;
        items.push(CacheRecord {
            path: path.clone(),
            modified: modified.clone(),
            cache_path: Some(cache_path.clone()),
        });

        return Ok(cache_path);
    }

    Err(())
}
