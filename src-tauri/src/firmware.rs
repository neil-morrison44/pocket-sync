use regex::Regex;
use serde::Deserialize;
use serde_json::json;
use std::path::PathBuf;
use tokio::io::AsyncWriteExt;

use crate::hashes::md5_for_file;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct NextProps {
    page_props: serde_json::Value,
}

async fn get_build_id() -> Result<Option<String>, reqwest::Error> {
    let body = reqwest::get("https://www.analogue.co/support/pocket/firmware")
        .await?
        .text()
        .await?;

    Ok({
        let re = Regex::new(r#"_next/static/([^/]+)/_buildManifest\.js"#).unwrap();
        if let Some(capture) = re.captures(&body) {
            let extracted_string = capture.get(1).unwrap().as_str();
            Some(String::from(extracted_string))
        } else {
            None
        }
    })
}

pub async fn get_firmware_json() -> Result<serde_json::Value, reqwest::Error> {
    let build_id = get_build_id().await?;

    if let Some(build_id) = build_id {
        let json_url = format!(
        "https://www.analogue.co/_next/data/{build_id}/support/pocket/firmware.json?product=pocket"
    );
        let json_body = reqwest::get(json_url).await?.text().await?;
        let props: NextProps = serde_json::from_str(&json_body).unwrap();
        Ok(props.page_props)
    } else {
        Ok(json!("{}"))
    }
}

pub async fn get_release_notes(version: &str) -> Result<serde_json::Value, reqwest::Error> {
    let build_id = get_build_id().await?;

    if let Some(build_id) = build_id {
        let json_url = format!(
        "https://www.analogue.co/_next/data/{build_id}/support/pocket/firmware/{version}.json?product=pocket&version={version}"
    );
        let json_body = reqwest::get(json_url).await?.text().await?;
        let props: NextProps = serde_json::from_str(&json_body).unwrap();
        Ok(props.page_props)
    } else {
        Ok(json!("{}"))
    }
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
