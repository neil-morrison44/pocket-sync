use std::path::PathBuf;
use std::{error, fs};
use walkdir::WalkDir;

pub fn find_dotfiles(root: &PathBuf) -> Result<Vec<String>, Box<dyn error::Error>> {
    let walker = WalkDir::new(&root).into_iter();
    let dotfiles: Vec<String> = walker
        .into_iter()
        .filter_map(|x| x.ok())
        .filter(|e| e.path().is_file())
        .filter(|e| {
            let file_name = e.path().file_name().and_then(|f| f.to_str()).unwrap();

            file_name.starts_with("._") || file_name == ".DS_Store"
        })
        .map(|e| String::from(e.path().to_str().unwrap()))
        .collect();

    Ok(dotfiles)
}
