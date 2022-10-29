use crate::{PlatformSave, SaveInfo};

#[derive(Debug, PartialEq)]
pub struct SavePair<'a> {
    pocket: &'a SaveInfo,
    mister: &'a SaveInfo,
}
#[derive(Debug, PartialEq)]
pub enum SaveComparison<'a> {
    PocketOnly(&'a SaveInfo),
    MiSTerOnly(&'a SaveInfo),
    PocketNewer(SavePair<'a>),
    MiSTerNewer(SavePair<'a>),
    Conflict(SavePair<'a>),
}

pub fn check_save<'a>(
    save: &'a PlatformSave,
    pocket_saves: &'a Vec<PlatformSave>,
    mister_saves: &'a Vec<PlatformSave>,
    last_merge: u64,
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
            // TODO handle conficts
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
    last_merge: u64,
) -> SaveComparison<'a> {
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
            if (mister_save.core == save.core && mister_save.game == save.game) {
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
            if (pocket_save.core == save.core && pocket_save.game == save.game) {
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
