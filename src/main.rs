mod config_file;
mod cores;
mod mister_ftp;
mod pocket_files;
mod save_compare;
mod user_input;

use chrono::TimeZone;
use clap::Parser;
use cores::{SupportedCore, TransformCore};
use std::{
    fmt, fs,
    path::{Path, PathBuf},
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use walkdir::{DirEntry, WalkDir};

use crate::{
    config_file::PocketSyncConfig,
    mister_ftp::logged_in_ftp,
    user_input::{report_status, UserInput},
};
use crate::{
    save_compare::{remove_duplicates, SaveComparison},
    user_input::choose_save,
};

#[derive(Debug, PartialEq)]
pub struct SaveInfo {
    pub game: String,
    pub path: PathBuf,
    pub date_modified: i64,
    pub core: SupportedCore,
}

impl fmt::Display for SaveInfo {
    // This trait requires `fmt` with this exact signature.
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let time = chrono::Local.timestamp(self.date_modified.try_into().unwrap(), 0);
        write!(
            f,
            "Name: {}\nLast Modified: {}\nCore: {}",
            self.game,
            time,
            self.core.to_pocket()
        )
    }
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
    let args = Args::parse();
    let mut config = PocketSyncConfig::read(&args.path);

    if let Ok(pocket_saves) = find_pocket_saves(&args.path) {
        if let Ok(mister_saves) =
            find_mister_saves(&args.host_mister, &args.user_mister, &args.password_mister)
        {
            let mut save_comparisons: Vec<SaveComparison> = Vec::new();

            for pocket_save in &pocket_saves {
                save_comparisons.push(save_compare::check_save(
                    &pocket_save,
                    &pocket_saves,
                    &mister_saves,
                    config.last_run_timestamp,
                ))
            }

            for mister_save in &mister_saves {
                save_comparisons.push(save_compare::check_save(
                    &mister_save,
                    &pocket_saves,
                    &mister_saves,
                    config.last_run_timestamp,
                ))
            }

            let save_comparisons = remove_duplicates(save_comparisons);
            let user_choice = report_status(&save_comparisons);

            match user_choice {
                UserInput::Cancel => {
                    println!("Ok, exiting!");
                    std::process::exit(0);
                }
                _ => {}
            }

            for save_comp in save_comparisons {
                let choice = match &save_comp {
                    SaveComparison::Conflict(save_pair) => choose_save(&save_pair),
                    SaveComparison::MiSTerNewer(_) | SaveComparison::MiSTerOnly(_) => {
                        UserInput::UseMister
                    }
                    SaveComparison::PocketNewer(_) | SaveComparison::PocketOnly(_) => {
                        UserInput::UsePocket
                    }
                    SaveComparison::NoSyncNeeded => UserInput::Skip,
                };

                if choice == UserInput::Skip {
                    continue;
                }

                if let Ok(mut ftp_stream) =
                    logged_in_ftp(&args.host_mister, &args.user_mister, &args.password_mister)
                {
                    match choice {
                        UserInput::UseMister => {
                            save_comp
                                .use_mister(&mut ftp_stream, &args.path)
                                .expect("Failed to copy save from MiSTer");
                        }
                        UserInput::UsePocket => {
                            save_comp
                                .use_pocket(&mut ftp_stream, &args.path)
                                .expect("Failed to copy save from Pocket");
                        }
                        _ => {}
                    }
                }
            }

            let start = SystemTime::now();
            config.last_run_timestamp = start
                .duration_since(UNIX_EPOCH)
                .expect("Time went backwards")
                .as_secs() as i64;

            // Push a little bit into the future so an immediate re-run finds nothing
            config.last_run_timestamp += 60;
            config.write(&args.path);

            println!("All done!");
            std::process::exit(0);
        } else {
            println!("Failed to get MiSTer saves");
            std::process::exit(1);
        }
    } else {
        println!("Failed to get Pocket saves");
        std::process::exit(1);
    }
}

fn find_pocket_saves(path: &PathBuf) -> Result<Vec<PlatformSave>, String> {
    println!("Scanning Pocket files");
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
                                .as_secs() as i64,
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
) -> Result<Vec<PlatformSave>, suppaftp::FtpError> {
    println!("Connecting to MiSTer");
    let mut ftp_stream = logged_in_ftp(host, user, password)?;
    let mut saves: Vec<PlatformSave> = Vec::new();
    let _ = ftp_stream.cwd("/media/fat/saves")?;
    let systems = ftp_stream.nlst(None)?;

    for system in systems {
        print!(".");
        let _ = ftp_stream.cwd(&system)?;
        let system_saves = ftp_stream.nlst(None)?;
        for system_save in system_saves {
            let modtime = ftp_stream.mdtm(&system_save)?;
            if let Some(core) = SupportedCore::from_mister(&system) {
                saves.push(PlatformSave::MiSTerSave(SaveInfo {
                    game: String::from(&system_save),
                    path: PathBuf::from(format!("/media/fat/saves/{system}/{system_save}")),
                    date_modified: modtime.timestamp(),
                    core,
                }))
            }
        }

        let _ = ftp_stream.cwd("..")?;
    }
    let _ = ftp_stream.quit()?;
    print!("\n");
    return Ok(saves);
}
