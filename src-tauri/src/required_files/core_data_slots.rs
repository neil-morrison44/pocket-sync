use crate::required_files::parameters_bitmap::ParsedParams;

use super::{DataSlot, DataSlotFile, DataSlotFileStatus};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
struct CoreData {
    pub data_slots: Vec<DataSlot>,
}

#[derive(Debug, Serialize, Deserialize)]
struct CoreDataFile {
    pub data: CoreData,
}

pub async fn process_core_data(
    core_id: &str,
    pocket_path: &PathBuf,
    platform_ids: Vec<&str>,
) -> Result<(Vec<DataSlotFile>, Vec<DataSlot>)> {
    let file_path = pocket_path.join(format!("Cores/{}/data.json", core_id));
    let file_string = tokio::fs::read_to_string(file_path).await?;
    let core_data: CoreDataFile = serde_json::from_str(&file_string)?;
    let data_slots = core_data.data.data_slots;

    let cloned_data_slots = data_slots.clone();

    let files = data_slots
        .into_iter()
        .filter_map(|data_slot| match data_slot.filename {
            Some(filename) => {
                let params = ParsedParams::from(data_slot.parameters);

                let pocket_local_path = format!(
                    "Assets/{}/{}/{}",
                    platform_ids[params.platform_index],
                    (if params.core_specific {
                        core_id
                    } else {
                        "common"
                    }),
                    filename
                );

                Some(DataSlotFile {
                    name: String::from(filename),
                    path: pocket_path.join(pocket_local_path),
                    status: DataSlotFileStatus::Exists,
                })
            }
            None => None,
        })
        .collect();

    Ok((files, cloned_data_slots))
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use std::{fs, io::Write};
    use tempdir::TempDir;

    fn data_json_setup() -> Result<PathBuf> {
        let tmp_dir = TempDir::new("core_data_slots")?;
        let tmp_path = tmp_dir.into_path();
        // Create a temporary JSON file
        let core_folder = tmp_path.join("Cores/tester.TestCore");
        fs::create_dir_all(&core_folder)?;
        let mut data_file = fs::File::create(core_folder.join("data.json"))?;

        data_file.write_all(
            r#"
        {
            "data":{
                "magic": "APF_VER_1",
                "data_slots": [
                    {
                        "name": "Arcade Game",
                        "id": 0,
                        "required": true,
                        "parameters": "0x113",
                        "extensions": [
                            "json"
                        ],
                        "address": "",
                        "nonvolatile": false
                    },
                    {
                        "name": "ROM",
                        "id": 1,
                        "required": true,
                        "parameters": "0x108",
                        "extensions": [
                            "rom"
                        ],
                        "address": "0x00000000",
                        "nonvolatile": false
                    },
                    {
                        "name": "NVRAM",
                        "id": 2,
                        "required": false,
                        "parameters": "0x100",
                        "extensions": [
                            "sav"
                        ],
                        "address": "0x00000000",
                        "nonvolatile": true
                    },
                    {
                        "name": "Test BIN",
                        "id": 6,
                        "required": true,
                        "parameters": "0x1",
                        "filename": "test.bin",
                        "extensions": [
                            "bin"
                        ],
                        "address": "0x00000000",
                        "nonvolatile": false
                    },
                    {
                        "name": "Test BIN 2",
                        "id": 7,
                        "required": true,
                        "parameters": "0x113",
                        "filename": "test_2.bin",
                        "extensions": [
                            "bin"
                        ],
                        "address": "0x00000000",
                        "nonvolatile": false
                    },
                    {
                        "name": "JTBETA",
                        "id": 17,
                        "required": false,
                        "parameters": "0x1000000",
                        "filename": "beta.bin",
                        "extensions": [
                            "bin"
                        ],
                        "address": "0x00000000",
                        "nonvolatile": false
                    }
                ]
            }
        }"#
            .as_bytes(),
        )?;

        Ok(tmp_path)
    }

    #[tokio::test]
    async fn for_a_complex_core() -> Result<()> {
        let tmp_path = data_json_setup()?;
        let (data_slot_files, data_slots) = process_core_data(
            "tester.TestCore",
            &tmp_path,
            vec!["platform_one", "platform_two"],
        )
        .await?;

        dbg!("{:?}", &data_slot_files);
        assert_eq!(
            data_slot_files,
            vec![
                DataSlotFile {
                    name: String::from("test.bin"),
                    path: tmp_path.join("Assets/platform_one/common/test.bin"),
                    status: DataSlotFileStatus::Exists
                },
                DataSlotFile {
                    name: String::from("test_2.bin"),
                    path: tmp_path.join("Assets/platform_one/tester.TestCore/test_2.bin"),
                    status: DataSlotFileStatus::Exists
                },
                DataSlotFile {
                    name: String::from("beta.bin"),
                    path: tmp_path.join("Assets/platform_two/common/beta.bin"),
                    status: DataSlotFileStatus::Exists
                }
            ]
        );

        assert_eq!(data_slots, vec![]);
        Ok(())
    }
}
