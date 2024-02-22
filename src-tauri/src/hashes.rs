use anyhow::Result;
use md5::{Digest, Md5};
use once_cell::sync::Lazy;
use std::{collections::HashMap, io::Read, path::PathBuf};
use tokio::sync::RwLock;

use crate::util::get_mtime_timestamp;

static MD5_HASH_CACHE: Lazy<RwLock<HashMap<(PathBuf, u64), String>>> = Lazy::new(|| {
    let m = HashMap::new();
    RwLock::new(m)
});

pub async fn md5_for_file(file_path: &PathBuf) -> Result<String> {
    let full_path = file_path.clone();
    let timestamp = get_mtime_timestamp(&full_path).await?;

    {
        let cache_guard = MD5_HASH_CACHE.read().await;
        if let Some(hash) = cache_guard.get(&(PathBuf::from(&full_path), timestamp)) {
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

    {
        let mut cache_guard = MD5_HASH_CACHE.write().await;
        cache_guard.insert((PathBuf::from(&file_path), timestamp), hexed_hash.clone());
    }

    Ok(hexed_hash)
}

static CRC32_HASH_CACHE: Lazy<RwLock<HashMap<(PathBuf, u64), u32>>> = Lazy::new(|| {
    let m = HashMap::new();
    RwLock::new(m)
});

pub async fn crc32_for_file(file_path: &PathBuf) -> Result<u32> {
    let timestamp = get_mtime_timestamp(&file_path).await?;

    {
        let cache_guard = CRC32_HASH_CACHE.read().await;
        if let Some(hash) = cache_guard.get(&(PathBuf::from(&file_path), timestamp)) {
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

    {
        let mut cache_guard = CRC32_HASH_CACHE.write().await;
        cache_guard.insert((PathBuf::from(&file_path), timestamp), crc32.clone());
    }

    Ok(crc32)
}
