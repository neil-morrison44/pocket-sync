mod archive_metadata;
mod core_data_slots;
mod find_instance_files;
mod parameters_bitmap;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

use crate::{
    core_json_files::{core::CoreFile, CoreDetails},
    required_files::archive_metadata::get_metadata_from_archive,
};

use self::{find_instance_files::find_instance_files, parameters_bitmap::SlotParameters};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(untagged)]
enum IntOrHexString {
    Int(u32),
    HexString(String),
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
struct ArchiveInfo {
    url: String,
    crc32: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
enum RootFile {
    UnZipped(PathBuf),
    Zipped { zip: PathBuf, file: String },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
enum DataSlotFileStatus {
    Exists,
    NeedsUpdateFromArchive(ArchiveInfo),
    MissingButOnArchive(ArchiveInfo),
    FoundAtRoot(RootFile),
    NotFound,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct DataSlotFile {
    name: String,
    path: PathBuf,
    status: DataSlotFileStatus,
}

pub async fn required_files_for_core(
    core_id: &str,
    pocket_path: &PathBuf,
    include_alts: bool,
    archive_url: &str,
) -> Result<Vec<DataSlotFile>> {
    let core_details: CoreDetails =
        CoreFile::from_core_path(&pocket_path.join(format!("Cores/{}", core_id)))?.into();
    let mut data_slot_files = vec![];
    let assets_folder = &pocket_path.join(format!(
        "Assets/{}/{}",
        &core_details.main_platform_id, core_id
    ));

    let (instance_files, archive_meta) = tokio::join!(
        find_instance_files(&assets_folder, include_alts),
        get_metadata_from_archive(archive_url)
    );

    dbg!(&instance_files);
    // dbg!(&archive_meta);

    // load core's data json
    // load each instance json, passing the

    Ok(data_slot_files)
}
