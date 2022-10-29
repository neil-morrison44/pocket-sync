use serde::{Deserialize, Serialize};
use std::{fs, io::ErrorKind, path::PathBuf};

#[derive(Serialize, Deserialize, Debug)]
pub struct PocketSyncConfig {
    last_run_timestamp: Option<u64>,
    ignore_list: Vec<String>,
}

impl PocketSyncConfig {
    pub fn read(pocket_path: &PathBuf) -> PocketSyncConfig {
        let json_path = pocket_path.join("pocket_sync.json");
        if let Ok(data) = fs::read_to_string(&json_path).or_else(|err| match err.kind() {
            ErrorKind::NotFound => {
                let default_struct = PocketSyncConfig {
                    last_run_timestamp: None,
                    ignore_list: vec![],
                };

                default_struct.write(pocket_path);
                let json = serde_json::to_string(&default_struct);
                json
            }
            _ => panic!("Error trying to read config {}", err),
        }) {
            if let Ok(result) = serde_json::from_str(&data) {
                return result;
            }
        }

        panic!("Failed to read or create pocket_sync.json")
    }

    pub fn write(&self, pocket_path: &PathBuf) -> () {
        let json_path = pocket_path.join("pocket_sync.json");
        if let Ok(json) = serde_json::to_string(&self) {
            fs::write(&json_path, &json).expect("Failed to write pocket_sync.json");
        }
    }
}
