use anyhow::Result;
use md5::{Digest, Md5};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, io::Read, path::PathBuf};
use tokio::sync::RwLock;

use crate::util::get_mtime_timestamp;

#[derive(Default, Serialize, Deserialize, Debug)]
pub struct HashCache {
    pub crc32: HashMap<(PathBuf, u64), u32>,
    pub md5: HashMap<(PathBuf, u64), String>,
}

pub type HashCacheState = RwLock<HashCache>;

pub async fn md5_for_file(
    file_path: &PathBuf,
    hash_cache: Option<&RwLock<HashCache>>,
) -> Result<String> {
    let full_path = file_path.clone();
    let timestamp = get_mtime_timestamp(&full_path).await?;

    if let Some(hash_cache) = hash_cache {
        let cache_guard = hash_cache.read().await;
        if let Some(hash) = cache_guard.md5.get(&(PathBuf::from(&full_path), timestamp)) {
            return Ok(String::from(hash));
        }
    }

    let handle = {
        tokio::task::spawn_blocking(move || {
            let mut hasher = Md5::new();
            let mut file = std::fs::File::open(full_path).unwrap();
            let chunk_size = 0x4000;

            loop {
                let mut chunk = Vec::with_capacity(chunk_size);
                if let Ok(n) = std::io::Read::by_ref(&mut file)
                    .take(chunk_size as u64)
                    .read_to_end(&mut chunk)
                {
                    if n == 0 {
                        break;
                    }
                    hasher.update(&chunk);
                    if n < chunk_size {
                        break;
                    }
                }
            }

            let checksum = hasher.finalize();
            checksum
        })
    };

    let hash = handle.await?;
    let hexed_hash = hex::encode(hash);

    if let Some(hash_cache) = hash_cache {
        let mut cache_guard = hash_cache.write().await;
        cache_guard
            .md5
            .insert((PathBuf::from(&file_path), timestamp), hexed_hash.clone());
    }

    Ok(hexed_hash)
}

pub async fn crc32_for_file(
    file_path: &PathBuf,
    hash_cache: Option<&RwLock<HashCache>>,
) -> Result<u32> {
    let timestamp = get_mtime_timestamp(&file_path).await?;

    if let Some(hash_cache) = hash_cache {
        let cache_guard = hash_cache.read().await;
        if let Some(hash) = cache_guard
            .crc32
            .get(&(PathBuf::from(&file_path), timestamp))
        {
            return Ok(hash.clone());
        }
    }

    let handle = {
        let full_path = file_path.clone();
        tokio::task::spawn_blocking(move || {
            let mut hasher = crc32fast::Hasher::new();
            let mut file = std::fs::File::open(full_path).unwrap();
            let chunk_size = 0x4000;

            loop {
                let mut chunk = Vec::with_capacity(chunk_size);
                if let Ok(n) = std::io::Read::by_ref(&mut file)
                    .take(chunk_size as u64)
                    .read_to_end(&mut chunk)
                {
                    if n == 0 {
                        break;
                    }
                    hasher.update(&chunk);
                    if n < chunk_size {
                        break;
                    }
                }
            }

            let checksum = hasher.finalize();
            checksum
        })
    };

    let crc32 = handle.await?;

    if let Some(hash_cache) = hash_cache {
        let mut cache_guard = hash_cache.write().await;
        cache_guard
            .crc32
            .insert((PathBuf::from(&file_path), timestamp), crc32.clone());
    }

    Ok(crc32)
}
