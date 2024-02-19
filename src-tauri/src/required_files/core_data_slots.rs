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
    platform_ids: &Vec<String>,
) -> Result<(Vec<DataSlotFile>, Vec<DataSlot>)> {
    let file_path = pocket_path.join(format!("Cores/{}/data.json", core_id));
    let file_string = tokio::fs::read_to_string(file_path).await?;
    let core_data: CoreDataFile = serde_json::from_str(&file_string)?;
    let data_slots = core_data.data.data_slots;

    let cloned_data_slots = data_slots.clone();

    let files =
        data_slots
            .into_iter()
            .filter_map(|data_slot| match data_slot.filename {
                Some(filename) => {
                    let params = ParsedParams::from(data_slot.parameters);
                    let pocket_local_path = PathBuf::from(format!(
                        "Assets/{}/{}",
                        platform_ids[params.platform_index],
                        (if params.core_specific {
                            core_id
                        } else {
                            "common"
                        })
                    ));

                    let mut slots = vec![DataSlotFile {
                        name: String::from(&filename),
                        path: pocket_local_path.join(&filename),
                        required: data_slot.required,
                        status: DataSlotFileStatus::NotChecked,
                        md5: data_slot.md5.clone(),
                    }];

                    if let Some(alternate_filenames) = data_slot.alternate_filenames {
                        slots.extend(alternate_filenames.into_iter().map(|alt_filename| {
                            DataSlotFile {
                                name: String::from(&alt_filename),
                                path: pocket_local_path.join(&alt_filename),
                                required: data_slot.required,
                                status: DataSlotFileStatus::NotChecked,
                                md5: data_slot.md5.clone(),
                            }
                        }))
                    }

                    Some(slots)
                }
                None => None,
            })
            .flatten()
            .collect();

    Ok((files, cloned_data_slots))
}

#[cfg(test)]
mod tests {
    use crate::required_files::parameters_bitmap::SlotParameters;
    use crate::required_files::IntOrHexString::*;

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
                        "alternate_filenames": ["test_alt_2.bin"],
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
            &vec![String::from("platform_one"), String::from("platform_two")],
        )
        .await?;

        dbg!("{:?}", &data_slot_files);
        assert_eq!(
            data_slot_files,
            vec![
                DataSlotFile {
                    name: String::from("test.bin"),
                    path: PathBuf::from("Assets/platform_one/common/test.bin"),
                    required: true,
                    status: DataSlotFileStatus::NotChecked,
                    md5: None
                },
                DataSlotFile {
                    name: String::from("test_2.bin"),
                    path: PathBuf::from("Assets/platform_one/tester.TestCore/test_2.bin"),
                    required: true,
                    status: DataSlotFileStatus::NotChecked,
                    md5: None
                },
                DataSlotFile {
                    name: String::from("test_alt_2.bin"),
                    path: PathBuf::from("Assets/platform_one/tester.TestCore/test_alt_2.bin"),
                    required: true,
                    status: DataSlotFileStatus::NotChecked,
                    md5: None
                },
                DataSlotFile {
                    name: String::from("beta.bin"),
                    path: PathBuf::from("Assets/platform_two/common/beta.bin"),
                    required: false,
                    status: DataSlotFileStatus::NotChecked,
                    md5: None
                }
            ]
        );

        assert_eq!(
            data_slots,
            vec![
                DataSlot {
                    name: String::from("Arcade Game"),
                    id: Int(0),
                    required: true,
                    parameters: SlotParameters::from("0x113"),
                    filename: None,
                    alternate_filenames: None,
                    md5: None
                },
                DataSlot {
                    name: String::from("ROM"),
                    id: Int(1),
                    required: true,
                    parameters: SlotParameters::from("0x108"),
                    alternate_filenames: None,
                    filename: None,
                    md5: None
                },
                DataSlot {
                    name: String::from("NVRAM"),
                    id: Int(2),
                    required: false,
                    parameters: SlotParameters::from("0x100"),
                    alternate_filenames: None,
                    filename: None,
                    md5: None
                },
                DataSlot {
                    name: String::from("Test BIN"),
                    id: Int(6),
                    required: true,
                    parameters: SlotParameters::from("0x1"),
                    filename: Some(String::from("test.bin")),
                    alternate_filenames: None,
                    md5: None
                },
                DataSlot {
                    name: String::from("Test BIN 2"),
                    id: Int(7),
                    required: true,
                    parameters: SlotParameters::from("0x113"),
                    filename: Some(String::from("test_2.bin")),
                    alternate_filenames: Some(vec![String::from("test_alt_2.bin")]),
                    md5: None
                },
                DataSlot {
                    name: String::from("JTBETA"),
                    id: Int(17),
                    required: false,
                    parameters: SlotParameters::from("0x1000000"),
                    filename: Some(String::from("beta.bin")),
                    alternate_filenames: None,
                    md5: None
                }
            ]
        );
        Ok(())
    }
}
