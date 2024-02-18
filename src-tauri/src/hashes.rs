use anyhow::Result;
use md5::{Digest, Md5};
use std::{io::Read, path::PathBuf};

pub async fn md5_for_file(file_path: &PathBuf) -> Result<String> {
    let handle = {
        let full_path = file_path.clone();
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
    Ok(hexed_hash)
}

pub async fn crc32_for_file(file_path: &PathBuf) -> Result<u32> {
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

    Ok(crc32)
}
