use super::{archive_metadata::RawMetadataItem, ArchiveInfo, DataSlotFile};
use crate::{
    hashes::{crc32_for_file, md5_for_file},
    required_files::DataSlotFileStatus,
    root_files::RootFile,
};
use anyhow::Result;
use std::{collections::HashMap, path::PathBuf};

fn normalize_path_str(path_str: &str) -> String {
    path_str.replace('\\', "/")
}

pub async fn check_data_file_status(
    mut data_slot_files: Vec<DataSlotFile>,
    archive_metadata: Vec<RawMetadataItem>,
    files_at_root: Vec<RootFile>,
    pocket_path: &PathBuf,
) -> Result<Vec<DataSlotFile>> {
    let archive_hash: HashMap<_, _> = archive_metadata
        .into_iter()
        .map(|metadata_item| (String::from(&metadata_item.name), metadata_item))
        .collect();

    let root_file_hash: HashMap<_, _> = files_at_root
        .into_iter()
        .map(|root_file| match &root_file {
            RootFile::Zipped { inner_file, .. } => (String::from(inner_file), root_file),
            RootFile::UnZipped { file_name, .. } => (String::from(file_name.clone()), root_file),
        })
        .collect();

    for mut data_slot_file in data_slot_files.iter_mut() {
        let file_path = pocket_path.join(&data_slot_file.path);
        let exists = tokio::fs::try_exists(&file_path).await?;
        let path = normalize_path_str(&data_slot_file.path.to_string_lossy());

        data_slot_file.status = match (
            archive_hash.get(&data_slot_file.name),
            archive_hash.get(&path),
            exists,
            root_file_hash.get(&data_slot_file.name),
        ) {
            (_, _, false, Some(root_file)) => DataSlotFileStatus::FoundAtRoot {
                root: root_file.clone(),
            },

            (_, _, true, Some(root_file)) => {
                let placed_file_md5 = md5_for_file(&file_path).await?;
                let root_file_md5 = String::from(match root_file {
                    RootFile::Zipped { md5, .. } => md5,
                    RootFile::UnZipped { md5, .. } => md5,
                });
                let data_slot_file_md5 = data_slot_file.md5.clone();

                match (data_slot_file_md5, placed_file_md5, root_file_md5) {
                    (Some(slot_md5), placed_md5, _) if slot_md5 == placed_md5 => {
                        DataSlotFileStatus::Exists
                    }
                    (Some(slot_md5), _, root_md5) if root_md5 == slot_md5 => {
                        DataSlotFileStatus::FoundAtRoot {
                            root: root_file.clone(),
                        }
                    }
                    (Some(slot_md5), _, root_md5) if root_md5 != slot_md5 => {
                        DataSlotFileStatus::RootNeedsUpdate {
                            root: root_file.clone(),
                        }
                    }
                    (Some(_), _, _) | (None, _, _) => DataSlotFileStatus::FoundAtRoot {
                        root: root_file.clone(),
                    },
                }
            }

            (None, None, true, _) => DataSlotFileStatus::Exists,
            (None, None, false, _) => DataSlotFileStatus::NotFound,
            (None, Some(metadata_item), false, _)
            | (Some(metadata_item), None, false, _)
            | (Some(_), Some(metadata_item), false, _) => {
                let RawMetadataItem {
                    name, crc32, mtime, ..
                } = metadata_item;

                DataSlotFileStatus::MissingButOnArchive(ArchiveInfo {
                    url: name.clone(),
                    crc32: crc32.clone().unwrap_or_default(),
                    mtime: mtime.clone(),
                })
            }

            (None, Some(metadata_item), true, _)
            | (Some(_), Some(metadata_item), true, _)
            | (Some(metadata_item), None, true, _) => {
                let RawMetadataItem {
                    name, crc32, mtime, ..
                } = metadata_item;
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
                            mtime: mtime.clone(),
                        })
                    }
                } else {
                    DataSlotFileStatus::NeedsUpdateFromArchive(ArchiveInfo {
                        url: name.clone(),
                        crc32: crc32.clone().unwrap_or_default(),
                        mtime: mtime.clone(),
                    })
                }
            }
        };
    }

    Ok(data_slot_files)
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use std::{fs, io::Write};
    use tempdir::TempDir;

    fn files_setup() -> Result<PathBuf> {
        let tmp_dir = TempDir::new("core_data_slots")?;
        let tmp_path = tmp_dir.into_path();
        // Create a temporary JSON file
        let assets_folder = tmp_path.join("Assets/platform_one/tester.TestCore/common");
        fs::create_dir_all(&assets_folder)?;
        let data_file_path = assets_folder.join("file_that_exists.bin");
        let mut data_file = fs::File::create(&data_file_path)?;
        data_file.write_all(b"hello")?;

        let old_data_file_path = assets_folder.join("file_updated_on_archive.bin");
        let mut old_data_file = fs::File::create(&old_data_file_path)?;
        old_data_file.write_all(b"hello again")?;

        let data_file_path = assets_folder.join("root_and_folder_data_file.bin");
        let mut data_file = fs::File::create(&data_file_path)?;
        data_file.write_all(b"world - copied root")?;

        let root_data_file_path = assets_folder.join("root_and_folder_data_file.bin");
        let mut root_data_file = fs::File::create(&root_data_file_path)?;
        root_data_file.write_all(b"world - copied root")?;

        let root_data_file_path = assets_folder.join("root_data_file.bin");
        let mut root_data_file = fs::File::create(&root_data_file_path)?;
        root_data_file.write_all(b"world - new root")?;

        let root_data_file_path = assets_folder.join("old_root_data_file.bin");
        let mut root_data_file = fs::File::create(&root_data_file_path)?;
        root_data_file.write_all(b"world - old root")?;

        fs::create_dir_all(&assets_folder.join("nested"))?;
        let nested_data_path = &assets_folder.join("nested/file_that_exists.bin");
        let mut nested_data_file = fs::File::create(&nested_data_path)?;
        nested_data_file.write_all(b"hello this file is nested")?;

        Ok(tmp_path)
    }

    #[tokio::test]
    async fn for_lots_of_normal_files() -> Result<()> {
        let tmp_path = files_setup()?;

        let data_slot_files = vec![
            DataSlotFile {
                name: String::from("file_that_exists.bin"),
                path: PathBuf::from(
                    "Assets/platform_one/tester.TestCore/common/file_that_exists.bin",
                ),
                required: true,
                status: DataSlotFileStatus::NotChecked,
                md5: Some(String::from("abcd")),
            },
            DataSlotFile {
                name: String::from("file_on_archive.bin"),
                path: PathBuf::from(
                    "Assets/platform_one/tester.TestCore/common/file_on_archive.bin",
                ),
                required: true,
                status: DataSlotFileStatus::NotChecked,
                md5: None,
            },
            DataSlotFile {
                name: String::from("file_on_archive_full_path.bin"),
                path: PathBuf::from(
                    "Assets/platform_one/tester.TestCore/common/file_on_archive_full_path.bin",
                ),
                required: true,
                status: DataSlotFileStatus::NotChecked,
                md5: None,
            },
            DataSlotFile {
                name: String::from("file_updated_on_archive.bin"),
                path: PathBuf::from(
                    "Assets/platform_one/tester.TestCore/common/file_updated_on_archive.bin",
                ),
                required: true,
                status: DataSlotFileStatus::NotChecked,
                md5: None,
            },
            DataSlotFile {
                name: String::from("file_not_on_archive.bin"),
                path: PathBuf::from(
                    "Assets/platform_one/tester.TestCore/common/file_not_on_archive.bin",
                ),
                required: true,
                status: DataSlotFileStatus::NotChecked,
                md5: None,
            },
        ];

        let archive_metadata = vec![
            RawMetadataItem {
                name: String::from("file_that_exists.bin"),
                crc32: Some(String::from("3610A686")),
                md5: None,
                mtime: None,
            },
            RawMetadataItem {
                name: String::from("file_on_archive.bin"),
                crc32: Some(String::from("1234")),
                md5: None,
                mtime: None,
            },
            RawMetadataItem {
                name: String::from(
                    "Assets/platform_one/tester.TestCore/common/file_on_archive_full_path.bin",
                ),
                crc32: Some(String::from("1234")),
                md5: None,
                mtime: None,
            },
            RawMetadataItem {
                name: String::from("file_updated_on_archive.bin"),
                crc32: Some(String::from("000")),
                md5: None,
                mtime: None,
            },
        ];

        let data_slot_files =
            check_data_file_status(data_slot_files, archive_metadata, vec![], &tmp_path).await?;

        dbg!("{:?}", &data_slot_files);
        assert_eq!(
            data_slot_files,
            vec![
                DataSlotFile {
                    name: String::from("file_that_exists.bin"),
                    path: PathBuf::from(
                        "Assets/platform_one/tester.TestCore/common/file_that_exists.bin",
                    ),
                    required: true,
                    status: DataSlotFileStatus::Exists,
                    md5: Some(String::from("abcd")),
                },
                DataSlotFile {
                    name: String::from("file_on_archive.bin"),
                    path: PathBuf::from(
                        "Assets/platform_one/tester.TestCore/common/file_on_archive.bin",
                    ),
                    required: true,
                    status: DataSlotFileStatus::MissingButOnArchive(ArchiveInfo {
                        url: String::from("file_on_archive.bin"),
                        crc32: String::from("1234")
                    }),
                    md5: None,
                },
                DataSlotFile {
                    name: String::from("file_on_archive_full_path.bin"),
                    path: PathBuf::from(
                        "Assets/platform_one/tester.TestCore/common/file_on_archive_full_path.bin",
                    ),
                    required: true,
                    status: DataSlotFileStatus::MissingButOnArchive(ArchiveInfo {
                        url: String::from("Assets/platform_one/tester.TestCore/common/file_on_archive_full_path.bin"),
                        crc32: String::from("1234")
                    }),
                    md5: None,
                },
                DataSlotFile {
                    name: String::from("file_updated_on_archive.bin"),
                    path: PathBuf::from(
                        "Assets/platform_one/tester.TestCore/common/file_updated_on_archive.bin",
                    ),
                    required: true,
                    status: DataSlotFileStatus::NeedsUpdateFromArchive(ArchiveInfo {
                        url: String::from("file_updated_on_archive.bin"),
                        crc32: String::from("000")
                    }),
                    md5: None,
                },
                DataSlotFile {
                    name: String::from("file_not_on_archive.bin"),
                    path: PathBuf::from(
                        "Assets/platform_one/tester.TestCore/common/file_not_on_archive.bin",
                    ),
                    required: true,
                    status: DataSlotFileStatus::NotFound,
                    md5: None,
                },
            ]
        );

        Ok(())
    }

    #[tokio::test]
    async fn for_a_file_at_root() -> Result<()> {
        let tmp_path = files_setup()?;

        let data_slot_files = vec![
            DataSlotFile {
                name: String::from("root_data_file.bin"),
                path: PathBuf::from(
                    "Assets/platform_one/tester.TestCore/common/root_data_file.bin",
                ),
                required: true,
                status: DataSlotFileStatus::NotChecked,
                md5: Some(String::from("md5_abcd")),
            },
            DataSlotFile {
                name: String::from("old_root_data_file.bin"),
                path: PathBuf::from(
                    "Assets/platform_one/tester.TestCore/common/old_root_data_file.bin",
                ),
                required: true,
                status: DataSlotFileStatus::NotChecked,
                md5: Some(String::from("md5_1234")),
            },
            DataSlotFile {
                name: String::from("root_and_folder_data_file.bin"),
                path: PathBuf::from(
                    "Assets/platform_one/tester.TestCore/common/root_and_folder_data_file.bin",
                ),
                required: true,
                status: DataSlotFileStatus::NotChecked,
                md5: Some(String::from("81584f68b5d4dca82e281195337c7b00")),
            },
        ];

        let archive_metadata = vec![];

        let root_files = vec![
            RootFile::Zipped {
                zip_file: String::from("root_data_file.zip"),
                inner_file: String::from("root_data_file.bin"),
                crc32: 128,
                md5: String::from("md5_abcd"),
            },
            RootFile::Zipped {
                zip_file: String::from("old_root_data_file.zip"),
                inner_file: String::from("old_root_data_file.bin"),
                crc32: 128,
                md5: String::from("md5_5678"),
            },
            RootFile::UnZipped {
                file_name: String::from("root_and_folder_data_file.bin"),
                crc32: 128,
                md5: String::from("81584f68b5d4dca82e281195337c7b00"),
            },
        ];

        let data_slot_files =
            check_data_file_status(data_slot_files, archive_metadata, root_files, &tmp_path)
                .await?;

        dbg!("{:?}", &data_slot_files);
        assert_eq!(
            data_slot_files,
            vec![
                DataSlotFile {
                    name: String::from("root_data_file.bin"),
                    path: PathBuf::from(
                        "Assets/platform_one/tester.TestCore/common/root_data_file.bin"
                    ),
                    required: true,
                    status: DataSlotFileStatus::FoundAtRoot {
                        root: RootFile::Zipped {
                            zip_file: String::from("root_data_file.zip"),
                            inner_file: String::from("root_data_file.bin"),
                            crc32: 128,
                            md5: String::from("md5_abcd")
                        }
                    },
                    md5: Some(String::from("md5_abcd"))
                },
                DataSlotFile {
                    name: String::from("old_root_data_file.bin"),
                    path: PathBuf::from(
                        "Assets/platform_one/tester.TestCore/common/old_root_data_file.bin"
                    ),
                    required: true,
                    status: DataSlotFileStatus::RootNeedsUpdate {
                        root: RootFile::Zipped {
                            zip_file: String::from("old_root_data_file.zip"),
                            inner_file: String::from("old_root_data_file.bin"),
                            crc32: 128,
                            md5: String::from("md5_5678")
                        }
                    },
                    md5: Some(String::from("md5_1234"))
                },
                DataSlotFile {
                    name: String::from("root_and_folder_data_file.bin"),
                    path: PathBuf::from(
                        "Assets/platform_one/tester.TestCore/common/root_and_folder_data_file.bin"
                    ),
                    required: true,
                    status: DataSlotFileStatus::Exists,
                    md5: Some(String::from("81584f68b5d4dca82e281195337c7b00"))
                }
            ]
        );

        Ok(())
    }

    #[tokio::test]
    async fn for_a_windows_style_path() -> Result<()> {
        let tmp_path = files_setup()?;

        let data_slot_files = vec![DataSlotFile {
            name: String::from("file_that_exists.bin"),
            path: PathBuf::from(
                "Assets\\platform_one\\tester.TestCore\\common\\nested\\file_that_exists.bin",
            ),
            required: true,
            status: DataSlotFileStatus::NotChecked,
            md5: None,
        }];

        let archive_metadata = vec![RawMetadataItem {
            name: String::from(
                "Assets/platform_one/tester.TestCore/common/nested/file_that_exists.bin",
            ),
            crc32: Some(String::from("3610A686")),
            md5: None,
            mtime: None,
        }];

        let root_files = vec![];

        let data_slot_files =
            check_data_file_status(data_slot_files, archive_metadata, root_files, &tmp_path)
                .await?;

        dbg!("{:?}", &data_slot_files);
        assert_eq!(
            data_slot_files,
            vec![DataSlotFile {
                name: String::from("file_that_exists.bin"),
                path: PathBuf::from(
                    "Assets\\platform_one\\tester.TestCore\\common\\nested\\file_that_exists.bin",
                ),
                required: true,
                status: DataSlotFileStatus::MissingButOnArchive(ArchiveInfo {
                    url: String::from(
                        "Assets/platform_one/tester.TestCore/common/nested/file_that_exists.bin"
                    ),
                    crc32: String::from("3610A686")
                }),
                md5: None,
            },]
        );

        Ok(())
    }
}
