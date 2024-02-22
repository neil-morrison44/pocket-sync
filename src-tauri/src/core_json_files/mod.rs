use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct CoreDetails {
    pub author: String,
    pub main_platform_id: String,
    pub shortname: String,
    pub platform_ids: Vec<String>,
}

pub mod core;
pub mod updaters;
