use chrono::{DateTime, Utc};
use std::{
    fs,
    path::{Path, PathBuf},
    time::SystemTime,
};
use walkdir::WalkDir;
#[derive(Debug)]
struct SaveInfo {
    game: String,
    path: PathBuf,
    date_modified: SystemTime, //DateTime<Utc>,
}
#[derive(Debug)]
enum PlatformSave {
    PocketSave(SaveInfo),
    MiSTerSave(SaveInfo),
}

use clap::Parser;

/// Simple program to greet a person
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    path: PathBuf,
}

fn main() {
    println!("Hello, world!");
    let args = Args::parse();

    if let Ok(saves) = find_pocket_saves(&args.path) {
        dbg!(saves);
    }
}

fn find_pocket_saves(path: &PathBuf) -> Result<Vec<PlatformSave>, String> {
    let mut saves: Vec<PlatformSave> = Vec::new();
    let saves_path = Path::new(path).join("Saves");

    for entry in WalkDir::new(saves_path).into_iter().filter_map(|e| e.ok()) {
        if !entry.file_type().is_file() {
            continue;
        }

        if let Some(extension) = entry.path().extension() {
            if extension == "sav" {
                if let Ok(metadata) = fs::metadata(entry.path()) {
                    println!("{}", entry.path().display());
                    if let Ok(time) = metadata.modified() {
                        println!("{time:?}");

                        saves.push(PlatformSave::PocketSave(SaveInfo {
                            game: String::from(entry.file_name().to_str().unwrap_or("unknown")),
                            path: PathBuf::from(entry.path()),
                            date_modified: time,
                        }))
                    } else {
                        println!("Not supported on this platform");
                    }
                }
            }
        }
    }

    return Ok(saves);
}
