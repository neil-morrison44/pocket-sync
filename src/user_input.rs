use question::{Answer, Question};

use crate::save_compare::{SaveComparison, SavePair};

pub enum UserInput {
    Ok,
    Cancel,
    UseMister,
    UsePocket,
    Skip,
    AddToIgnoreList,
}

pub fn choose_save(save_pair: &SavePair) -> UserInput {
    println!("{}", save_pair);
    let answer = Question::new("Use MiSTer or Pocket save?\n([m]ister/[p]ocket/[s]kip):")
        .acceptable(vec!["pocket", "mister", "p", "m", "skip", "s"])
        .until_acceptable()
        .ask();

    match answer {
        Some(Answer::RESPONSE(response)) => match response.as_str() {
            "mister" | "m" => UserInput::UseMister,
            "pocket" | "p" => UserInput::UsePocket,
            _ => UserInput::Cancel,
        },
        _ => UserInput::Cancel,
    }
}

pub fn report_status(saves: &Vec<SaveComparison>) -> UserInput {
    let (mister_count, pocket_count, conflict_count, no_sync_needed_count) =
        count_save_types(&saves);
    println!(
        "Found {} Saves; with {} conflicts, {} newer MiSTer saves, {} newer pocket saves, and {} which don't need synced",
        saves.len(),
        conflict_count,
        mister_count,
        pocket_count,
        no_sync_needed_count
    );

    let answer = Question::new("Do you want to continue the sync?")
        .yes_no()
        .default(Answer::YES)
        .show_defaults()
        .tries(3)
        .ask();

    match answer {
        Some(Answer::YES) => UserInput::Ok,
        _ => UserInput::Cancel,
    }
}

fn count_save_types(saves: &Vec<SaveComparison>) -> (u32, u32, u32, u32) {
    let mut mister_count: u32 = 0;
    let mut pocket_count: u32 = 0;
    let mut conflict_count: u32 = 0;
    let mut no_sync_needed_count: u32 = 0;

    for save in saves {
        match save {
            SaveComparison::MiSTerOnly(_) => {
                mister_count += 1;
            }
            SaveComparison::MiSTerNewer(_) => {
                mister_count += 1;
            }
            SaveComparison::PocketOnly(_) => {
                pocket_count += 1;
            }
            SaveComparison::PocketNewer(_) => {
                pocket_count += 1;
            }
            SaveComparison::Conflict(_) => {
                conflict_count += 1;
            }
            _ => {
                no_sync_needed_count += 1;
            }
        }
    }

    (
        mister_count,
        pocket_count,
        conflict_count,
        no_sync_needed_count,
    )
}
