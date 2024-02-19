use super::{archive_metadata::RawMetadataItem, ArchiveInfo, DataSlotFile};
use crate::{hashes::crc32_for_file, required_files::DataSlotFileStatus, root_files::RootFile};
use anyhow::Result;
use std::{collections::HashMap, path::PathBuf};

pub async fn check_data_file_status(
    mut data_slot_files: Vec<DataSlotFile>,
    archive_metadata: Vec<RawMetadataItem>,
    files_at_root: Vec<RootFile>,
    pocket_path: &PathBuf,
) -> Result<Vec<DataSlotFile>> {
    let archive_hash: HashMap<_, _> = archive_metadata
        .into_iter()
        .map(|metadata_item| (metadata_item.name.clone(), metadata_item))
        .collect();

    let root_file_hash: HashMap<_, _> = files_at_root
        .into_iter()
        .map(|root_file| match &root_file {
            RootFile::Zipped { inner_file, .. } => (inner_file.clone(), root_file),
            RootFile::UnZipped { file_name, .. } => (file_name.clone(), root_file),
        })
        .collect();

    for mut data_slot_file in data_slot_files.iter_mut() {
        let exists = tokio::fs::try_exists(&pocket_path.join(&data_slot_file.path)).await?;
        let path = data_slot_file.path.to_str().unwrap();

        data_slot_file.status = match (
            archive_hash.get(&data_slot_file.name),
            archive_hash.get(path),
            exists,
            root_file_hash.get(&data_slot_file.name),
        ) {
            (_, _, false, Some(root_file)) => DataSlotFileStatus::FoundAtRoot {
                root: root_file.clone(),
            },
            (_, _, true, Some(root_file)) => {
                // TODO: Check the MD5 of the root file vs the data slot and return either exists or
                // A new one that says the root is out of date

                DataSlotFileStatus::FoundAtRoot {
                    root: root_file.clone(),
                }
            }
            (None, None, true, _) => DataSlotFileStatus::Exists,
            (None, None, false, _) => DataSlotFileStatus::NotFound,
            (None, Some(RawMetadataItem { name, crc32, .. }), false, _)
            | (Some(RawMetadataItem { name, crc32, .. }), None, false, _)
            | (Some(_), Some(RawMetadataItem { name, crc32, .. }), false, _) => {
                DataSlotFileStatus::MissingButOnArchive(ArchiveInfo {
                    url: name.clone(),
                    crc32: crc32.clone().unwrap_or_default(),
                })
            }
            (None, Some(RawMetadataItem { name, crc32, .. }), true, _)
            | (Some(_), Some(RawMetadataItem { name, crc32, .. }), true, _)
            | (Some(RawMetadataItem { name, crc32, .. }), None, true, _) => {
                let file_crc32 = crc32_for_file(&pocket_path.join(&data_slot_file.path)).await?;

                if let Some(archive_crc32) = &crc32
                    .as_ref()
                    .and_then(|crc32| (u32::from_str_radix(&crc32, 16).ok()))
                {
                    if archive_crc32 == &file_crc32 {
                        DataSlotFileStatus::Exists
                    } else {
                        DataSlotFileStatus::NeedsUpdateFromArchive(ArchiveInfo {
                            url: name.clone(),
                            crc32: crc32.clone().unwrap_or_default(),
                        })
                    }
                } else {
                    DataSlotFileStatus::NeedsUpdateFromArchive(ArchiveInfo {
                        url: name.clone(),
                        crc32: crc32.clone().unwrap_or_default(),
                    })
                }
            }
        };
    }

    Ok(data_slot_files)
}
