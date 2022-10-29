mod config_file;
mod cores;
mod save_compare;

use cores::{SupportedCore, TransformCore};
use std::{
    fs,
    path::{Path, PathBuf},
    time::{Duration, SystemTime},
};
use walkdir::{DirEntry, WalkDir};

use clap::Parser;
use ftp::FtpStream;

use crate::config_file::PocketSyncConfig;
use crate::save_compare::{remove_duplicates, SaveComparison};

#[derive(Debug, PartialEq)]
pub struct SaveInfo {
    pub game: String,
    pub path: PathBuf,
    pub date_modified: u64,
    pub core: SupportedCore,
}
#[derive(Debug)]
pub enum PlatformSave {
    PocketSave(SaveInfo),
    MiSTerSave(SaveInfo),
}

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    path: PathBuf,

    #[arg(long)]
    host_mister: String,

    #[arg(long, default_value = "root")]
    user_mister: String,

    #[arg(long, default_value = "1")]
    password_mister: String,
}

fn main() {
    println!("Hello, world!");
    let args = Args::parse();

    let config = PocketSyncConfig::read(&args.path);

    dbg!(config);

    if let Ok(pocket_saves) = find_pocket_saves(&args.path) {
        dbg!(&pocket_saves);

        if let Ok(mister_saves) =
            find_mister_saves(&args.host_mister, &args.user_mister, &args.password_mister)
        {
            dbg!(&mister_saves);

            let mut save_comparisons: Vec<SaveComparison> = Vec::new();

            for pocket_save in &pocket_saves {
                save_comparisons.push(save_compare::check_save(
                    &pocket_save,
                    &pocket_saves,
                    &mister_saves,
                    0,
                ))
            }

            for mister_save in &mister_saves {
                save_comparisons.push(save_compare::check_save(
                    &mister_save,
                    &pocket_saves,
                    &mister_saves,
                    0,
                ))
            }

            let save_comparisons = remove_duplicates(save_comparisons);

            dbg!(save_comparisons);
        } else {
            println!("Failed to get MiSTer saves")
        }
    } else {
        println!("Failed to get Pocket saves")
    }

    // let mister_saves =
    //     find_mister_saves(&args.host_mister, &args.user_mister, &args.password_mister).unwrap();
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
                if let Ok(time) = fs::metadata(entry.path()).and_then(|md| md.modified()) {
                    if let Some(core) = SupportedCore::from_pocket(&get_pocket_system_name(&entry))
                    {
                        saves.push(PlatformSave::PocketSave(SaveInfo {
                            game: String::from(entry.file_name().to_str().unwrap_or("unknown")),
                            path: PathBuf::from(entry.path()),
                            date_modified: time
                                .duration_since(SystemTime::UNIX_EPOCH)
                                .unwrap_or(Duration::from_secs(0))
                                .as_secs(),
                            core,
                        }))
                    }
                }
            }
        }
    }

    return Ok(saves);
}

fn get_pocket_system_name(entry: &DirEntry) -> String {
    let mut current = entry.path();

    while let Some(parent) = current.parent() {
        if parent.ends_with("Saves") {
            return String::from(
                current
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("unknown"),
            );
        }

        current = parent;
    }

    return String::from("unknown");
}

fn find_mister_saves(
    host: &str,
    user: &str,
    password: &str,
) -> Result<Vec<PlatformSave>, ftp::FtpError> {
    let mut ftp_stream = FtpStream::connect(format!("{host}:21"))?;
    ftp_stream.login(user, password)?;
    let mut saves: Vec<PlatformSave> = Vec::new();
    println!("Current directory: {}", ftp_stream.pwd()?);
    let _ = ftp_stream.cwd("/media/fat/saves")?;
    let systems = ftp_stream.nlst(None)?;

    for system in systems {
        println!("Found Core: {}", &system);
        let _ = ftp_stream.cwd(&system)?;

        let system_saves = ftp_stream.nlst(None)?;

        for system_save in system_saves {
            if let Some(modtime) = ftp_stream.mdtm(&system_save)? {
                if let Some(core) = SupportedCore::from_mister(&system) {
                    saves.push(PlatformSave::MiSTerSave(SaveInfo {
                        game: String::from(&system_save),
                        path: PathBuf::from(format!("/media/fat/saves/{system}/{system_save}")),
                        date_modified: modtime.num_seconds_from_unix_epoch() as u64,
                        core,
                    }))
                }
            }
        }

        let _ = ftp_stream.cwd("..")?;
    }

    return Ok(saves);
}
