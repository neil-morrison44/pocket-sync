use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CoreDetails {
    pub author: String,
    pub platform_id: String,
    pub shortname: String,
}

pub mod core;
pub mod updaters;
