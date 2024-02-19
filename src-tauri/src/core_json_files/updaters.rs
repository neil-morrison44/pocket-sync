use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct CoreUpdateDetails {
    pub author: String,
    pub platform_id: String,
    pub shortname: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatersFile {
    pub previous: Option<Vec<CoreUpdateDetails>>,
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::error::Error;
    use tempdir::TempDir;

    fn core_folder_setup() -> Result<PathBuf, Box<dyn Error>> {
        let tmp_dir = TempDir::new("updaters_json_tests").unwrap();
        let tmp_path = tmp_dir.into_path();
        // Create a temporary JSON file
        let temp_file = tmp_path.join("updaters.json");
        let json_data = r#"
          {
            "previous": [{ "author": "author_name", "shortname": "short_name", "platform_id": "platform_id" }]
          }
      "#;
        println!("{:?}", &temp_file);
        fs::write(&temp_file, json_data)?;
        let temp_path = temp_file.to_path_buf();
        Ok(temp_path.parent().unwrap().to_path_buf())
    }

    #[test]
    fn test_from_core_path() -> Result<(), Box<dyn Error>> {
        let core_folder = core_folder_setup()?;
        let updaters_file = UpdatersFile::from_core_path(&core_folder).unwrap();
        dbg!("{:?}", &updaters_file);

        assert_eq!(
            updaters_file.previous,
            Some(vec![CoreUpdateDetails {
                author: String::from("author_name"),
                platform_id: String::from("platform_id"),
                shortname: String::from("short_name")
            }])
        );

        Ok(())
    }
}
