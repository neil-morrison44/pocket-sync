use std::path::PathBuf;

use anyhow::Result;
use serde::{Deserialize, Serialize};

use crate::{
    files_from_zip::{self, crc32_file_in_zip, md5_file_in_zip},
    hashes::{crc32_for_file, md5_for_file},
};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(tag = "type")]
pub enum RootFile {
    Zipped {
        zip_file: String,
        inner_file: String,
        crc32: u32,
        md5: String,
    },
    UnZipped {
        file_name: String,
        crc32: u32,
        md5: String,
    },
}

pub async fn check_root_files(
    pocket_path: &PathBuf,
    extensions: Option<Vec<&str>>,
) -> Result<Vec<RootFile>> {
    let mut entries = tokio::fs::read_dir(&pocket_path.as_path()).await?;
    let mut results: Vec<RootFile> = Vec::new();

    while let Ok(Some(entry)) = entries.next_entry().await {
        if let Ok(metadata) = entry.metadata().await {
            if metadata.is_file() {
                let path = entry.path();
                if let (Some(ext), Some(file_name)) = (
                    path.extension().and_then(|s| s.to_str()),
                    path.file_name().and_then(|s| s.to_str()),
                ) {
                    if file_name.starts_with(".") {
                        continue;
                    }
                    if ext == "zip" {
                        let files = files_from_zip::list_files(&path).await?;
                        if files.len() > 0 {
                            let zip_file = String::from(file_name);
                            let inner_file = files[0].clone();
                            let file_path = PathBuf::from(&inner_file);
                            if let Some(ext) = file_path.extension() {
                                match extensions
                                    .as_ref()
                                    .and_then(|exts| Some(exts.iter().any(|&ex| ex == ext)))
                                {
                                    None | Some(true) => (),
                                    Some(false) => continue,
                                }
                            }

                            results.push(RootFile::Zipped {
                                crc32: crc32_file_in_zip(&pocket_path.join(&zip_file), &inner_file)
                                    .await?,
                                md5: md5_file_in_zip(&pocket_path.join(&file_name), &inner_file)
                                    .await?,
                                zip_file,
                                inner_file,
                            })
                        }
                    } else {
                        match extensions
                            .as_ref()
                            .and_then(|exts| Some(exts.iter().any(|&ex| ex == ext)))
                        {
                            None | Some(true) => (),
                            Some(false) => continue,
                        }

                        let file_name = String::from(file_name);
                        let file_path = &pocket_path.join(&file_name);
                        let md5 = md5_for_file(&file_path).await?;

                        results.push(RootFile::UnZipped {
                            crc32: crc32_for_file(&file_path).await?,
                            file_name,
                            md5,
                        });
                    }
                }
            }
        }
    }

    Ok(results)
}
