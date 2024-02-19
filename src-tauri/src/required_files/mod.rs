mod archive_metadata;
mod check_file_status;
mod core_data_slots;
mod find_instance_files;
mod instance_data_slots;
mod parameters_bitmap;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

use crate::{
    core_json_files::{core::CoreFile, CoreDetails},
    required_files::{
        archive_metadata::get_metadata_from_archive, core_data_slots::process_core_data,
        instance_data_slots::process_instance_data,
    },
    root_files::{check_root_files, RootFile},
};

use self::{
    check_file_status::check_data_file_status, find_instance_files::find_instance_files,
    parameters_bitmap::SlotParameters,
};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum IntOrHexString {
    Int(u32),
    HexString(String),
}

impl PartialEq for IntOrHexString {
    fn eq(&self, other: &Self) -> bool {
        let self_int: u32 = self.into();
        let other_int: u32 = other.into();

        self_int == other_int
    }
}

impl Into<u32> for IntOrHexString {
    fn into(self) -> u32 {
        match self {
            IntOrHexString::Int(i) => i,
            IntOrHexString::HexString(s) => {
                let without_prefix = s.trim_start_matches("0x");
                u32::from_str_radix(without_prefix, 16).unwrap_or(0)
            }
        }
    }
}

impl Into<u32> for &IntOrHexString {
    fn into(self) -> u32 {
        match self {
            IntOrHexString::Int(i) => *i,
            IntOrHexString::HexString(s) => {
                let without_prefix = s.trim_start_matches("0x");
                u32::from_str_radix(without_prefix, 16).unwrap_or(0)
            }
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct DataSlot {
    name: String,
    id: IntOrHexString,
    required: bool,
    parameters: SlotParameters,
    filename: Option<String>,
    md5: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InstanceDataSlot {
    id: IntOrHexString,
    filename: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct ArchiveInfo {
    url: String,
    crc32: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(tag = "type")]
enum DataSlotFileStatus {
    Exists,
    NeedsUpdateFromArchive(ArchiveInfo),
    MissingButOnArchive(ArchiveInfo),
    FoundAtRoot { root: RootFile },
    NotFound,
    NotChecked,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct DataSlotFile {
    name: String,
    path: PathBuf,
    required: bool,
    status: DataSlotFileStatus,
}

impl DataSlotFile {
    pub fn should_be_downloaded(self: &Self) -> bool {
        !self.name.ends_with(".sav")
            && (self.name.contains("bios")
                || self.name.contains("beta.bin")
                || self.required
                || true)
    }
}

const SKIP_INSTANCE_FILES_FOR: [&str; 3] = [
    "Mazamars312.NeoGeo",
    "Mazamars312.NeoGeo_Overdrive",
    "Mazamars312.PC Engine CD",
];

pub async fn required_files_for_core(
    core_id: &str,
    pocket_path: &PathBuf,
    include_alts: bool,
    archive_url: &str,
) -> Result<Vec<DataSlotFile>> {
    let core_details: CoreDetails =
        CoreFile::from_core_path(&pocket_path.join(format!("Cores/{}", core_id)))?.into();
    let mut data_slot_files: Vec<DataSlotFile> = vec![];
    let assets_folder = &pocket_path.join(format!(
        "Assets/{}/{}",
        &core_details.main_platform_id, core_id
    ));

    let (instance_files, archive_meta, files_at_root) = tokio::join!(
        find_instance_files(&assets_folder, include_alts),
        get_metadata_from_archive(archive_url),
        check_root_files(&pocket_path, Some(vec!["rom", "bin"]))
    );

    let (core_data_slot_files, core_data_slots) =
        process_core_data(core_id, pocket_path, &core_details.platform_ids).await?;

    data_slot_files.extend(
        core_data_slot_files
            .into_iter()
            .filter(|data_slot| data_slot.should_be_downloaded()),
    );

    if !SKIP_INSTANCE_FILES_FOR.contains(&core_id) {
        for instance_file_path in instance_files {
            let instance_data_slots = process_instance_data(
                core_id,
                &instance_file_path,
                &core_details.platform_ids,
                &core_data_slots,
            )
            .await?;

            data_slot_files.extend(
                instance_data_slots
                    .into_iter()
                    .filter(|data_slot| data_slot.should_be_downloaded()),
            );
        }
    }

    data_slot_files.sort_unstable_by(|a, b| a.path.partial_cmp(&b.path).unwrap());
    data_slot_files.dedup();

    if let (Ok(archive_meta), Ok(files_at_root)) = (archive_meta, files_at_root) {
        data_slot_files =
            check_data_file_status(data_slot_files, archive_meta, files_at_root, pocket_path)
                .await?;
    }

    Ok(data_slot_files)
}
