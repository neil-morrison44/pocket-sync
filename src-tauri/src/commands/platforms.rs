use crate::{PocketSyncState, app_error::AppError};
use log::{debug, error};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::Path};
use tokio::fs;

#[derive(Serialize, Deserialize)]
pub struct PlatformData {
    category: String,
    name: String,
    manufacturer: String,
    year: u32,
}

#[derive(Deserialize)]
struct PlatformFile {
    platform: PlatformData,
}

pub type PlatformShortName = String;

#[derive(Serialize, Deserialize)]
pub struct FullPlatformData {
    active: HashMap<PlatformShortName, PlatformData>,
    archived: HashMap<PlatformShortName, PlatformData>,
}

#[tauri::command(async)]
pub async fn all_platform_data(
    state: tauri::State<'_, PocketSyncState>,
    _app_handle: tauri::AppHandle,
) -> Result<FullPlatformData, AppError> {
    debug!("Command: all_platform_data");

    let pocket_path = state.0.pocket_path.read().await;
    let platforms_path = pocket_path.join("Platforms");
    let platforms_archive_path = platforms_path.join("_archive");

    let active = read_platforms_from_dir(&platforms_path).await?;
    let archived = read_platforms_from_dir(&platforms_archive_path).await?;

    Ok(FullPlatformData { active, archived })
}

// Helper function to read, filter, and parse the directory
async fn read_platforms_from_dir(
    dir: &Path,
) -> Result<HashMap<PlatformShortName, PlatformData>, AppError> {
    let mut platforms = HashMap::new();

    // If the directory doesn't exist (e.g. no _archive folder), just return an empty map.
    if !dir.exists() || !dir.is_dir() {
        return Ok(platforms);
    }

    let mut entries = fs::read_dir(dir).await?;

    while let Ok(Some(entry)) = entries.next_entry().await {
        let path = entry.path();

        // Analogue specification says shortnames come from the filename (e.g., pdp1.json -> pdp1)
        // We only want to parse files with a .json extension (this automatically skips _images)
        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Some(file_stem) = path.file_stem().and_then(|s| s.to_str()) {
                // Read and deserialize
                match fs::read_to_string(&path).await {
                    Ok(content) => match serde_json::from_str::<PlatformFile>(&content) {
                        Ok(file_data) => {
                            platforms.insert(file_stem.to_string(), file_data.platform);
                        }
                        Err(e) => {
                            error!("Failed to parse platform JSON {:?}: {}", path, e);
                        }
                    },
                    Err(e) => {
                        error!("Failed to read file {:?}: {}", path, e);
                    }
                }
            }
        }
    }

    Ok(platforms)
}
