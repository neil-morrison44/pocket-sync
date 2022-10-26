use cores::Core;
use std::{
    fs,
    path::{Path, PathBuf},
    time::{Duration, SystemTime},
};
use walkdir::{DirEntry, WalkDir};

use clap::Parser;
use ftp::FtpStream;

mod cores;
#[derive(Debug)]
struct SaveInfo {
    game: String,
    path: PathBuf,
    date_modified: u64,
    core: cores::Core,
}
#[derive(Debug)]
enum PlatformSave {
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

    if let Ok(saves) = find_pocket_saves(&args.path) {
        dbg!(saves);
    }

    let mister_saves =
        find_mister_saves(&args.host_mister, &args.user_mister, &args.password_mister).unwrap();
    dbg!(mister_saves);
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
                    saves.push(PlatformSave::PocketSave(SaveInfo {
                        game: String::from(entry.file_name().to_str().unwrap_or("unknown")),
                        path: PathBuf::from(entry.path()),
                        date_modified: time
                            .duration_since(SystemTime::UNIX_EPOCH)
                            .unwrap_or(Duration::from_secs(0))
                            .as_secs(),
                        core: Core::Pocket(get_pocket_system_name(&entry)),
                    }))
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

    println!("Current directory: {}", ftp_stream.pwd()?);

    // println!("File List: {:?}", ftp_stream.list(None)?);

    let systems = ftp_stream.nlst(None)?;

    for system in systems {
        println!("Found Core: {}", &system);
        let _ = ftp_stream.cwd(&system)?;

        let system_saves = ftp_stream.nlst(None)?;

        for system_save in system_saves {
            if let Some(modtime) = ftp_stream.mdtm(&system_save)? {
                saves.push(PlatformSave::MiSTerSave(SaveInfo {
                    game: String::from(&system_save),
                    path: PathBuf::from(format!("/media/fat/saves/{system}/{system_save}")),
                    date_modified: modtime.num_seconds_from_unix_epoch() as u64,
                    core: Core::MiSTer(String::from(&system)),
                }))
            }
        }

        let _ = ftp_stream.cwd("..")?;
    }

    return Ok(saves);
}
