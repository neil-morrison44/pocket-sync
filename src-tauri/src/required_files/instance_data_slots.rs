use crate::required_files::parameters_bitmap::ParsedParams;

use super::{DataSlot, DataSlotFile, DataSlotFileStatus, IntOrHexString};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
struct InstanceDataSlot {
    id: IntOrHexString,
    filename: String,
    md5: Option<String>,
}

impl InstanceDataSlot {
    fn merge_with_core_slot(self: &Self, core_slots: &Vec<DataSlot>) -> Option<DataSlot> {
        if let Some(core_data_slot) = core_slots
            .iter()
            .find(|core_data_slot| core_data_slot.id == self.id)
        {
            return Some(DataSlot {
                name: core_data_slot.name.clone(),
                id: self.id.clone(),
                required: core_data_slot.required.clone(),
                parameters: core_data_slot.parameters.clone(),
                filename: Some(self.filename.clone()),
                alternate_filenames: None,
                md5: self.md5.clone(),
            });
        };

        None
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct InstanceData {
    #[serde(default)]
    pub data_path: String,
    #[serde(default)]
    pub data_slots: Vec<InstanceDataSlot>,
}

#[derive(Debug, Serialize, Deserialize)]
struct InstanceDataFile {
    pub instance: InstanceData,
}

pub async fn process_instance_data(
    core_id: &str,
    instance_file_path: &PathBuf,
    platform_ids: &Vec<String>,
    core_data_slots: &Vec<DataSlot>,
) -> Result<Vec<DataSlotFile>> {
    let file_string = tokio::fs::read_to_string(instance_file_path).await?;
    let instance_data: InstanceDataFile = serde_json::from_str(&file_string).unwrap();

    let InstanceData {
        data_path,
        data_slots,
    } = instance_data.instance;

    let files = data_slots
        .into_iter()
        .filter_map(|instance_data_slot| instance_data_slot.merge_with_core_slot(core_data_slots))
        .filter_map(|data_slot| match data_slot.filename {
            Some(filename) => {
                let params = ParsedParams::from(data_slot.parameters);
                let path = if data_path.len() > 0 {
                    format!("{data_path}/{filename}")
                } else {
                    format!("{filename}")
                };

                let pocket_local_path = format!(
                    "Assets/{}/{}/{}",
                    platform_ids[params.platform_index],
                    (if params.core_specific {
                        core_id
                    } else {
                        "common"
                    }),
                    path
                );

                Some(DataSlotFile {
                    name: String::from(filename),
                    path: PathBuf::from(pocket_local_path),
                    required: data_slot.required,
                    status: DataSlotFileStatus::NotChecked,
                    md5: data_slot.md5.clone(),
                })
            }
            None => None,
        })
        .collect();

    Ok(files)
}

#[cfg(test)]
mod tests {
    use crate::required_files::parameters_bitmap::SlotParameters;
    use crate::required_files::IntOrHexString::*;

    use super::*;
    use anyhow::Result;
    use std::{fs, io::Write};
    use tempdir::TempDir;

    fn instance_json_setup() -> Result<(PathBuf, PathBuf)> {
        let tmp_dir = TempDir::new("core_data_slots")?;
        let tmp_path = tmp_dir.into_path();
        // Create a temporary JSON file
        let instance_folder = tmp_path.join("Assets/platform_one/tester.TestCore");
        fs::create_dir_all(&instance_folder)?;
        let instance_file_path = instance_folder.join("instance.json");
        let mut data_file = fs::File::create(&instance_file_path)?;

        data_file.write_all(
            r#"{
              "instance":{
                "magic": "APF_VER_1",
                "variant_select": {
                  "id": 0,
                  "select": false
                },
                "data_path": "nested/folder/here",
                "data_slots": [
                  {
                    "id": 1,
                    "filename": "game.rom",
                    "md5": "abcd"
                  },
                  {
                    "id": 2,
                    "filename": "game.sav"
                  }
                ],
                "memory_writes": [
                  {
                    "address": "0xf9000000",
                    "data": "0x0"
                  }
                ]
              }
        }"#
            .as_bytes(),
        )?;

        Ok((tmp_path, instance_file_path))
    }

    #[tokio::test]
    async fn for_a_instance_file_with_multiple_things() -> Result<()> {
        let (_tmp_path, instance_file_path) = instance_json_setup()?;
        let data_slot_files = process_instance_data(
            "tester.TestCore",
            &instance_file_path,
            &vec![String::from("platform_one"), String::from("platform_two")],
            &vec![
                DataSlot {
                    name: String::from("Arcade Game"),
                    id: Int(1),
                    required: true,
                    parameters: SlotParameters::from("0x113"),
                    filename: None,
                    alternate_filenames: None,
                    md5: None,
                },
                DataSlot {
                    name: String::from("Save File"),
                    id: IntOrHexString::HexString(String::from("0x2")),
                    required: true,
                    parameters: SlotParameters::from("0x0"),
                    filename: None,
                    alternate_filenames: None,
                    md5: None,
                },
                DataSlot {
                    name: String::from("JTBETA"),
                    id: Int(17),
                    required: false,
                    parameters: SlotParameters::from("0x1000000"),
                    filename: Some(String::from("beta.bin")),
                    alternate_filenames: None,
                    md5: Some(String::from("1234")),
                },
            ],
        )
        .await?;

        dbg!("{:?}", &data_slot_files);
        assert_eq!(
            data_slot_files,
            vec![
                DataSlotFile {
                    name: String::from("game.rom"),
                    path: PathBuf::from(
                        "Assets/platform_one/tester.TestCore/nested/folder/here/game.rom"
                    ),
                    required: true,
                    status: DataSlotFileStatus::NotChecked,
                    md5: Some(String::from("abcd"))
                },
                DataSlotFile {
                    name: String::from("game.sav"),
                    path: PathBuf::from("Assets/platform_one/common/nested/folder/here/game.sav"),
                    required: true,
                    status: DataSlotFileStatus::NotChecked,
                    md5: None
                }
            ]
        );

        Ok(())
    }
}
