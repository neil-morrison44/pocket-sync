use async_walkdir::{Filtering, WalkDir};
use futures::StreamExt;
use std::path::PathBuf;

pub async fn find_instance_files(core_assets_folder: &PathBuf, include_alts: bool) -> Vec<PathBuf> {
    let mut walker = WalkDir::new(&core_assets_folder);
    walker = {
        if include_alts {
            walker.filter(|entry| async move {
                match (entry.file_type().await, entry.file_name().to_string_lossy()) {
                    (Ok(f), name) if f.is_dir() && name.starts_with(".") => Filtering::IgnoreDir,
                    (Ok(f), name) if f.is_file() && name.starts_with(".") => Filtering::Ignore,
                    _ => Filtering::Continue,
                }
            })
        } else {
            walker.filter(|entry| async move {
                match (entry.file_type().await, entry.file_name().to_string_lossy()) {
                    (Ok(f), name) if f.is_dir() && name.starts_with(".") => Filtering::IgnoreDir,
                    (Ok(f), name) if f.is_file() && name.starts_with(".") => Filtering::Ignore,
                    (Ok(f), name) if f.is_dir() && name.starts_with("_alternatives") => {
                        Filtering::IgnoreDir
                    }
                    _ => Filtering::Continue,
                }
            })
        }
    };

    let mut instance_files = Vec::new();

    while let Some(Ok(entry)) = walker.next().await {
        match entry.file_type().await {
            Ok(f) if f.is_file() => {
                let file_name = entry.file_name();
                let file_name = file_name.to_string_lossy();
                if file_name.ends_with(".json") {
                    instance_files.push(entry.path());
                }
            }
            Ok(_) => continue,
            Err(_) => break,
        }
    }

    instance_files.sort_unstable();
    instance_files
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use std::fs;
    use tempdir::TempDir;

    fn instance_json_setup() -> Result<PathBuf> {
        let tmp_dir = TempDir::new("required_files_find_files")?;
        let tmp_path = tmp_dir.into_path();
        // Create a temporary JSON file
        fs::File::create(tmp_path.join("not-json.txt"))?;
        fs::File::create(tmp_path.join("the-json.json"))?;
        fs::File::create(tmp_path.join(".hidden-json.json"))?;
        let alt_path = tmp_path.join("_alternatives");
        fs::create_dir(&alt_path)?;
        fs::File::create(alt_path.join(".hidden-alt-json.json"))?;
        fs::File::create(alt_path.join("alt-json.json"))?;

        let hidden_path = tmp_path.join(".hidden");
        fs::create_dir(&hidden_path)?;
        fs::File::create(hidden_path.join("nested-hidden-json.json"))?;

        Ok(tmp_path)
    }

    #[tokio::test]
    async fn without_alts() -> Result<()> {
        let assets_folder = instance_json_setup()?;
        let files = find_instance_files(&assets_folder, false).await;
        dbg!("{:?}", &files);
        assert_eq!(files, [assets_folder.join("the-json.json")]);
        Ok(())
    }

    #[tokio::test]
    async fn with_alts() -> Result<()> {
        let assets_folder = instance_json_setup()?;
        let files = find_instance_files(&assets_folder, true).await;
        dbg!("{:?}", &files);
        assert_eq!(
            files,
            [
                assets_folder.join("_alternatives/alt-json.json"),
                assets_folder.join("the-json.json"),
            ]
        );
        Ok(())
    }
}
