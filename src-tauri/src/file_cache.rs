use std::{fs::create_dir, path::PathBuf, time::SystemTime};
use tokio::{fs::File, io};

use std::hash::{Hash, Hasher};

pub static FILE_CACHE_FOLDER: &str = "file_caches";

pub async fn clear_file_caches(cache_dir: &PathBuf) -> io::Result<()> {
    let file_cache_dir = cache_dir.join(FILE_CACHE_FOLDER);
    if file_cache_dir.exists() {
        tokio::fs::remove_dir_all(file_cache_dir).await?;
    }
    Ok(())
}

pub async fn get_file_with_cache(path: &PathBuf, cache_dir: &PathBuf) -> io::Result<File> {
    let file = tokio::fs::File::open(&path).await?;
    let metadata = file.metadata().await?;
    let file_cache_dir = cache_dir.join(FILE_CACHE_FOLDER);
    if let (Ok(modified), length) = (&metadata.modified(), &metadata.len()) {
        if *length > 1000 {
            let cache_path = if let Some(existing_config_path) =
                find_in_cache(&path.into(), &modified, &file_cache_dir).await
            {
                Some(existing_config_path)
            } else {
                write_to_cache(path, modified, &file_cache_dir).await.ok()
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
    cache_dir: &PathBuf,
) -> Option<PathBuf> {
    let file_name = generate_filename_hash(path, modified);
    let file_path = cache_dir.join(file_name);

    if file_path.exists() {
        Some(file_path)
    } else {
        None
    }
}

async fn write_to_cache(
    path: &PathBuf,
    modified: &SystemTime,
    file_cache_dir: &PathBuf,
) -> Result<PathBuf, ()> {
    let file_name = generate_filename_hash(path, modified);
    if !file_cache_dir.exists() {
        create_dir(&file_cache_dir).expect("Failed to create cache directory");
    }
    let cache_path = file_cache_dir.join(file_name);
    if let Ok(_) = tokio::fs::copy(path, &cache_path).await {
        return Ok(cache_path);
    }

    Err(())
}

fn generate_filename_hash(path: &PathBuf, time: &SystemTime) -> String {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();

    // Hash the path
    path.hash(&mut hasher);

    // Hash the system time
    time.hash(&mut hasher);

    // Get the resulting hash value
    let hash_value = hasher.finish();

    format!("{:x}.bin", hash_value)
}
