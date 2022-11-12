use std::{
    ffi::OsStr,
    path::{Component, PathBuf},
};
use walkdir::WalkDir;

pub fn find_roms_for_save(
    save_name: &str,
    file_types: &Vec<String>,
    pocket_path: &PathBuf,
) -> Vec<PathBuf> {
    let mut found_paths = vec![];
    let assets_path = pocket_path.join("Assets");

    let potential_rom_names: Vec<String> = file_types
        .iter()
        .map(|f| save_name.replace(".sav", format!(".{}", f.as_str()).as_str()))
        .collect();

    for entry in WalkDir::new(assets_path).into_iter().filter_map(|e| e.ok()) {
        if !entry.file_type().is_file() {
            continue;
        }

        if let Some(file_name) = entry
            .file_name()
            .to_str()
            .and_then(|s| Some(String::from(s)))
        {
            if potential_rom_names.contains(&file_name) {
                found_paths.push(entry.path().to_path_buf());
            }
        }
    }

    found_paths
}

pub fn convert_rom_path_to_save_path(rom_path: &PathBuf) -> PathBuf {
    let file_name = format!("{}.sav", rom_path.file_stem().unwrap().to_str().unwrap());

    let mut save_path: PathBuf = PathBuf::new();
    let components = rom_path.components();
    for component in components {
        if component.as_os_str().to_string_lossy() == String::from("Assets") {
            save_path = save_path.join("Saves");
        } else {
            save_path = save_path.join(component);
        }
    }

    save_path.pop();
    save_path = save_path.join(file_name);

    save_path
}
