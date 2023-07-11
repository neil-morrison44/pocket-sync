use std::hash::{Hash, Hasher};
use std::{path::PathBuf, time::SystemTime};
use tokio::fs::create_dir;
use tokio::{fs::File, io};

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

    match (&metadata.modified(), *&metadata.len()) {
        (Ok(modified), 1_000..=u64::MAX) => {
            let cache_path = if let Some(existing_config_path) =
                find_in_cache(&path.into(), &modified, &file_cache_dir).await
            {
                Some(existing_config_path)
            } else {
                write_to_cache(path, modified, &file_cache_dir).await
            };

            if let Some(cache_path) = cache_path {
                let cached_file = tokio::fs::File::open(&cache_path).await?;
                return Ok(cached_file);
            }
        }
        _ => {}
    };

    Ok(file)
}

async fn find_in_cache(
    path: &PathBuf,
    modified: &SystemTime,
    cache_dir: &PathBuf,
) -> Option<PathBuf> {
    let file_name = generate_filename_hash(path, modified);
    let file_path = cache_dir.join(file_name);
    file_path.exists().then(|| file_path)
}

async fn write_to_cache(
    path: &PathBuf,
    modified: &SystemTime,
    file_cache_dir: &PathBuf,
) -> Option<PathBuf> {
    let file_name = generate_filename_hash(path, modified);
    if !file_cache_dir.exists() {
        if let Err(err) = create_dir(&file_cache_dir).await {
            println!(
                "Error creating {} as file cache {}",
                &file_cache_dir.display(),
                err
            );
            return None;
        }
    }
    let cache_path = file_cache_dir.join(file_name);

    tokio::fs::copy(path, &cache_path)
        .await
        .ok()
        .and_then(|_| Some(cache_path))
}

fn generate_filename_hash(path: &PathBuf, time: &SystemTime) -> String {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    path.hash(&mut hasher);
    time.hash(&mut hasher);
    format!("{:x}.bin", hasher.finish())
}
