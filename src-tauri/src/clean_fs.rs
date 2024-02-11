use async_walkdir::WalkDir;
use futures::StreamExt;
use std::error;
use std::path::PathBuf;

pub async fn find_dotfiles(root: &PathBuf) -> Result<Vec<String>, Box<dyn error::Error>> {
    let mut walker = WalkDir::new(&root);
    let mut dotfiles = Vec::new();

    while let Some(Ok(entry)) = walker.next().await {
        match entry.file_type().await {
            Ok(f) => {
                if f.is_file() {
                    let path = entry.path();
                    let file_name = path.file_name().and_then(|f| f.to_str()).unwrap();
                    if file_name.starts_with("._") || file_name == ".DS_Store" {
                        dotfiles.push(entry.path().to_str().unwrap().to_owned());
                    }
                }
            }
            Err(_) => continue,
        }
    }

    Ok(dotfiles)
}
