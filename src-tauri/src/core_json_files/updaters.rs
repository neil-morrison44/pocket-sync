use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

use super::CoreDetails;

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatersFile {
    pub previous: Option<Vec<CoreDetails>>,
}

impl UpdatersFile {
    pub fn from_core_path(core_path: &PathBuf) -> Option<UpdatersFile> {
        let updaters_file_path = core_path.join("updaters.json");

        if !updaters_file_path.exists() {
            return None;
        } else {
            let file_string = fs::read_to_string(updaters_file_path).unwrap();
            let file: UpdatersFile = serde_json::from_str(&file_string).unwrap();
            return Some(file);
        }
    }
}
