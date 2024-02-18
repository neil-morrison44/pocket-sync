use super::{archive_metadata::RawMetadataItem, DataSlotFile};
use crate::required_files::DataSlotFileStatus;
use std::{path::PathBuf, sync::Arc};

pub async fn check_data_file_status(
    data_slot_files: Vec<DataSlotFile>,
    archive_metadata: Vec<RawMetadataItem>,
    pocket_path: &PathBuf,
) -> Vec<DataSlotFile> {
    let archive_metadata = Arc::new(archive_metadata);

    // for mut data_slot_file in &data_slot_files {
    //     let mut data_slot_file = *data_slot_file;
    //     data_slot_file.status = DataSlotFileStatus::Exists;
    // }

    data_slot_files
}
