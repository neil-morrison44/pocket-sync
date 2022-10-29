use crate::{cores::TransformCore, PlatformSave, SaveInfo};
use std::{
    fmt,
    fs::File,
    io::{Read, Write},
    path::PathBuf,
};

#[derive(Debug, PartialEq)]
pub struct SavePair<'a> {
    pocket: &'a SaveInfo,
    mister: &'a SaveInfo,
}

impl SavePair<'_> {
    pub fn is_pocket_newer(&self) -> bool {
        self.pocket.date_modified > self.mister.date_modified
    }

    pub fn newer_save(&self) -> &SaveInfo {
        if self.pocket.date_modified > self.mister.date_modified {
            self.pocket
        } else {
            self.mister
        }
    }

    pub fn older_save(&self) -> &SaveInfo {
        if self.pocket.date_modified > self.mister.date_modified {
            self.mister
        } else {
            self.pocket
        }
    }
}

impl<'a> fmt::Display for SavePair<'a> {
    // This trait requires `fmt` with this exact signature.
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let titles = match self.is_pocket_newer() {
            true => ("-- Pocket (newer)", "-- Mister (older)"),
            false => ("-- MiSTer (newer)", "-- Pocket (older)"),
        };

        write!(
            f,
            "{}\n{} \n\n--- VS ---\n\n{}\n{}",
            titles.0,
            self.newer_save(),
            titles.1,
            self.older_save()
        )
    }
}

#[derive(Debug, PartialEq)]
pub enum SaveComparison<'a> {
    PocketOnly(&'a SaveInfo),
    MiSTerOnly(&'a SaveInfo),
    PocketNewer(SavePair<'a>),
    MiSTerNewer(SavePair<'a>),
    Conflict(SavePair<'a>),
    NoSyncNeeded,
}

impl SaveComparison<'_> {
    pub fn use_mister(
        &self,
        ftp_stream: &mut suppaftp::FtpStream,
        pocket_path: &PathBuf,
    ) -> Result<(), suppaftp::FtpError> {
        let path = match self {
            SaveComparison::MiSTerOnly(save_info) => &save_info.path,
            Self::PocketNewer(save_pair)
            | Self::MiSTerNewer(save_pair)
            | Self::Conflict(save_pair) => &save_pair.mister.path,
            _ => {
                panic!("Attempt to use a non-existent MiSTer save");
            }
        };

        let _ = ftp_stream.cwd(path.parent().unwrap().to_path_buf().to_str().unwrap())?;
        let file_name = path.file_name().unwrap();
        let mut save_file = ftp_stream.retr_as_buffer(file_name.to_str().unwrap())?;

        let pocket_save_path = match self {
            SaveComparison::MiSTerOnly(save_info) => {
                pocket_path.join(format!("/Saves/{}/common", save_info.core.to_pocket()))
            }
            Self::PocketNewer(save_pair)
            | Self::MiSTerNewer(save_pair)
            | Self::Conflict(save_pair) => save_pair.pocket.path.clone(),
            Self::PocketOnly(_) => panic!("Attempt to use a non-existent MiSTer save"),
            Self::NoSyncNeeded => panic!("Attempt to sync when NoSyncNeeded"),
        };

        println!(
            "Copying {} to {}",
            &path.to_str().unwrap(),
            &pocket_save_path.to_str().unwrap()
        );

        if let Ok(mut file) = File::create(pocket_save_path) {
            let mut buf: Vec<u8> = Vec::new();
            save_file.read_to_end(&mut buf).unwrap();
            file.write(&buf).unwrap();
        }
        return Ok(());
    }

    pub fn use_pocket(
        &self,
        ftp_stream: &mut suppaftp::FtpStream,
        pocket_path: &PathBuf,
    ) -> Result<(), suppaftp::FtpError> {
        let path = match self {
            SaveComparison::PocketOnly(save_info) => &save_info.path,
            Self::PocketNewer(save_pair)
            | Self::MiSTerNewer(save_pair)
            | Self::Conflict(save_pair) => &save_pair.pocket.path,
            _ => {
                panic!("Attempt to use a non-existent Pocket save");
            }
        };

        let file_name = path.file_name().unwrap();
        // let mut save_file = ftp_stream.simple_retr(file_name.to_str().unwrap())?;

        let mister_save_path = match self {
            SaveComparison::PocketOnly(save_info) => {
                pocket_path.join(format!("/media/fat/saves/{}", save_info.core.to_mister()))
            }
            Self::PocketNewer(save_pair)
            | Self::MiSTerNewer(save_pair)
            | Self::Conflict(save_pair) => save_pair.mister.path.clone(),
            Self::MiSTerOnly(_) => panic!("Attempt to use a non-existent MiSTer save"),
            Self::NoSyncNeeded => panic!("Attempt to sync when NoSyncNeeded"),
        };

        let mut file = File::open(path).unwrap();

        let mister_path_buf = &mister_save_path.to_path_buf();
        let mister_path = mister_path_buf.to_str().unwrap();

        println!("Copying {} to {mister_path}", &path.to_str().unwrap());

        ftp_stream.cwd(mister_path)?;
        ftp_stream.put_file(file_name.to_str().unwrap(), &mut file)?;

        return Ok(());
    }
}

pub fn check_save<'a>(
    save: &'a PlatformSave,
    pocket_saves: &'a Vec<PlatformSave>,
    mister_saves: &'a Vec<PlatformSave>,
    last_merge: i64,
) -> SaveComparison<'a> {
    match save {
        PlatformSave::PocketSave(pocket_save_info) => {
            if let Some(mister_save_info) =
                find_matching_mister_save(pocket_save_info, mister_saves)
            {
                return get_comparison(pocket_save_info, mister_save_info, last_merge);
            } else {
                return SaveComparison::PocketOnly(pocket_save_info);
            }
        }
        PlatformSave::MiSTerSave(mister_save_info) => {
            if let Some(pocket_save_info) =
                find_matching_pocket_save(mister_save_info, pocket_saves)
            {
                return get_comparison(pocket_save_info, mister_save_info, last_merge);
            } else {
                return SaveComparison::MiSTerOnly(mister_save_info);
            }
        }
    }
}

fn get_comparison<'a>(
    pocket_save_info: &'a SaveInfo,
    mister_save_info: &'a SaveInfo,
    last_merge: i64,
) -> SaveComparison<'a> {
    if pocket_save_info.date_modified < last_merge && mister_save_info.date_modified < last_merge {
        return SaveComparison::NoSyncNeeded;
    }

    if pocket_save_info.date_modified > last_merge && mister_save_info.date_modified > last_merge {
        return SaveComparison::Conflict(SavePair {
            pocket: pocket_save_info,
            mister: mister_save_info,
        });
    }

    if mister_save_info.date_modified > pocket_save_info.date_modified {
        return SaveComparison::MiSTerNewer(SavePair {
            pocket: pocket_save_info,
            mister: &mister_save_info,
        });
    } else {
        return SaveComparison::PocketNewer(SavePair {
            pocket: pocket_save_info,
            mister: mister_save_info,
        });
    }
}

fn find_matching_mister_save<'a>(
    save: &SaveInfo,
    saves: &'a Vec<PlatformSave>,
) -> Option<&'a SaveInfo> {
    for mister_save in saves {
        if let PlatformSave::MiSTerSave(mister_save) = mister_save {
            if mister_save.core == save.core && mister_save.game == save.game {
                return Some(&mister_save);
            }
        }
    }
    return None;
}

fn find_matching_pocket_save<'a>(
    save: &SaveInfo,
    saves: &'a Vec<PlatformSave>,
) -> Option<&'a SaveInfo> {
    for pocket_save in saves {
        if let PlatformSave::PocketSave(pocket_save) = pocket_save {
            if pocket_save.core == save.core && pocket_save.game == save.game {
                return Some(&pocket_save);
            }
        }
    }
    return None;
}

pub fn remove_duplicates<'a>(save_comparisons: Vec<SaveComparison<'a>>) -> Vec<SaveComparison<'a>> {
    let mut singles: Vec<SaveComparison> = Vec::new();

    for save_comparison in save_comparisons {
        if !singles.contains(&save_comparison) {
            singles.push(save_comparison)
        }
    }

    singles
}
