use std::path::PathBuf;

pub fn check_if_folder_looks_like_pocket(path: &PathBuf) -> bool {
    let json_path = path.join("Analogue_Pocket.json");

    if !json_path.exists() {
        return false;
    }

    let assets_path = path.join("Assets");

    if !assets_path.exists() {
        return false;
    }

    let cores_path = path.join("Cores");

    if !cores_path.exists() {
        return false;
    }

    // yeah, looks enough like a Pocket
    return true;
}
