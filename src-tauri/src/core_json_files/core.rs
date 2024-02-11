use super::CoreDetails;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

#[derive(Debug, Serialize, Deserialize)]
pub struct CoreMetadata {
    platform_ids: Vec<String>,
    shortname: String,
    description: String,
    author: String,
    url: String,
    version: String,
    date_release: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Framework {
    target_product: String,
    version_required: String,
    sleep_supported: bool,
    dock: Dock,
    hardware: Hardware,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Dock {
    supported: bool,
    analog_output: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Hardware {
    link_port: bool,
    cartridge_adapter: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Core {
    name: String,
    id: i32,
    filename: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CoreFile {
    Core {
        magic: String,
        metadata: CoreMetadata,
        framework: Framework,
        cores: Vec<Core>,
    },
}

impl CoreFile {
    pub fn from_core_path(core_path: &PathBuf) -> Result<CoreFile, Box<dyn std::error::Error>> {
        let core_file_path = core_path.join("core.json");
        let file_string = fs::read_to_string(core_file_path)?;
        let file: CoreFile = serde_json::from_str(&file_string)?;
        return Ok(file);
    }
}

impl Into<CoreDetails> for CoreFile {
    fn into(self) -> CoreDetails {
        match self {
            CoreFile::Core { metadata, .. } => CoreDetails {
                author: metadata.author,
                shortname: metadata.shortname,
                platform_id: metadata.platform_ids[0].clone(),
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::error::Error;
    use tempdir::TempDir;

    fn core_folder_setup() -> Result<PathBuf, Box<dyn Error>> {
        let tmp_dir = TempDir::new("core_json_tests").unwrap();
        let tmp_path = tmp_dir.into_path();
        // Create a temporary JSON file
        let core_temp_file = tmp_path.join("core.json");
        let json_data = r#"
          {
              "core": {
                  "magic": "APF_VER_1",
                  "metadata": {
                      "platform_ids": ["arduboy"],
                      "shortname": "Arduboy",
                      "description": "A small, portable Arduino console.",
                      "author": "agg23",
                      "url": "https://github.com/agg23/analogue-arduboy/",
                      "version": "0.9.0",
                      "date_release": "2022-09-03"
                  },
                  "framework": {
                      "target_product": "Analogue Pocket",
                      "version_required": "1.1",
                      "sleep_supported": false,
                      "dock": {
                          "supported": true,
                          "analog_output": false
                      },
                      "hardware": {
                          "link_port": false,
                          "cartridge_adapter": -1
                      }
                  },
                  "cores": [
                      {
                          "name": "default",
                          "id": 0,
                          "filename": "arduboy.rev"
                      }
                  ]
              }
          }
      "#;
        println!("{:?}", &core_temp_file);
        fs::write(&core_temp_file, json_data)?;
        let core_path = core_temp_file.to_path_buf();
        Ok(core_path.parent().unwrap().to_path_buf())
    }

    #[test]
    fn test_from_core_path_and_into_core_details() -> Result<(), Box<dyn Error>> {
        let core_folder = core_folder_setup()?;
        let core_file = CoreFile::from_core_path(&core_folder)?;
        dbg!("{:?}", &core_file);
        let core_details: CoreDetails = core_file.into();

        assert_eq!(core_details.author, "agg23");
        assert_eq!(core_details.shortname, "Arduboy");
        assert_eq!(core_details.platform_id, "arduboy");

        Ok(())
    }
}
