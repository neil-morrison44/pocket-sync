use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::io::AsyncWriteExt;

use crate::{hashes::md5_for_file, result_logger::ResultLogger};

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FirmwareListItem {
    version: String,
    product: String,
    published_at: String,
    url: String,
}

#[derive(Deserialize, Serialize)]
pub struct FirmwareDetails {
    version: String,
    product: String,
    published_at: String,
    url: String,
    download_url: Option<String>,
    file_size: Option<String>,
    md5: Option<String>,
    release_notes_html: String,
}

pub async fn get_firmware_json() -> Result<Vec<FirmwareListItem>, reqwest::Error> {
    let json_body = reqwest::get("https://www.analogue.co/support/pocket/firmware/list")
        .await?
        .text()
        .await?;
    let items: Vec<FirmwareListItem> = serde_json::from_str(&json_body).unwrap_and_log();
    Ok(items)
}

pub async fn get_release_notes(version: &str) -> Result<FirmwareDetails, reqwest::Error> {
    let json_url = format!("https://www.analogue.co/support/pocket/firmware/{version}/details");
    let json_body = reqwest::get(json_url).await?.text().await?;
    let release_details: FirmwareDetails = serde_json::from_str(&json_body).unwrap_and_log();
    Ok(release_details)
}

pub async fn download_firmware_file(
    url: &str,
    path: &PathBuf,
) -> Result<(), Box<dyn std::error::Error>> {
    let response = reqwest::get(url).await?;
    let bytes = response.bytes().await?;

    let mut file = tokio::io::BufWriter::new(tokio::fs::File::create(path).await?);
    file.write_all(&bytes).await?;
    file.flush().await?;
    Ok(())
}

pub async fn verify_firmware_file(
    file_path: &PathBuf,
    md5: &str,
) -> Result<bool, Box<dyn std::error::Error>> {
    let file_md5 = md5_for_file(file_path).await?;
    Ok(file_md5 == md5)
}
