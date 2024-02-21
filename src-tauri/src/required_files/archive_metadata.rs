use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct RawMetadataItem {
    pub name: String,
    pub crc32: Option<String>,
    pub md5: Option<String>,
    pub mtime: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct MetadataResponse {
    pub files: Vec<RawMetadataItem>,
}

pub async fn get_metadata_from_archive(url: &str) -> Result<Vec<RawMetadataItem>> {
    if url.len() == 0 {
        return Ok(vec![]);
    }
    let response = reqwest::get(url).await?.text().await?;
    let metadata: MetadataResponse = serde_json::from_str(&response)?;

    Ok(metadata.files)
}

#[cfg(test)]
mod tests {
    use super::*;

    enum ServerType {
        IA,
        RD,
    }

    fn setup_server(
        server_type: ServerType,
    ) -> Result<(String, mockito::Mock, mockito::ServerGuard)> {
        let mut server = mockito::Server::new();
        let url = server.url();

        let json_body = match server_type {
            ServerType::IA => {
                r#"{
              "created":1708114258,
              "files": [
                {
                  "name":"a_test_file.bin",
                  "source":"original",
                  "mtime":"1695137679",
                  "size":"3473472",
                  "md5":"f46af2ef83e0d4359e13290208828664",
                  "crc32":"8049042f",
                  "sha1":"517d1219cdbd6ef03f85b3da533536b3c6469260",
                  "format":"Unknown",
                  "viruscheck":"1706902757"
                }
              ]
            }"#
            }
            ServerType::RD => {
                r#"{
              "files": [
                {
                  "name":"a_test_file.bin",
                  "crc32":"8049042f"
                }
              ]
            }"#
            }
        };

        let mock = server
            .mock("GET", "/")
            .with_status(201)
            .with_header("content-type", "application/json")
            .with_body(json_body)
            .create();
        Ok((url, mock, server))
    }

    #[tokio::test]
    async fn archive_org_url() -> Result<()> {
        let (url, _mock, _server) = setup_server(ServerType::IA)?;
        let items = get_metadata_from_archive(&url).await?;
        dbg!("{:?}", &items);
        assert_eq!(
            items,
            vec![RawMetadataItem {
                name: String::from("a_test_file.bin"),
                crc32: Some(String::from("8049042f")),
                md5: Some(String::from("f46af2ef83e0d4359e13290208828664")),
                mtime: Some(String::from("1695137679"))
            }]
        );
        Ok(())
    }

    #[tokio::test]
    async fn retrodriven_url() -> Result<()> {
        let (url, _mock, _server) = setup_server(ServerType::RD)?;
        let items = get_metadata_from_archive(&url).await?;
        dbg!("{:?}", &items);
        assert_eq!(
            items,
            vec![RawMetadataItem {
                name: String::from("a_test_file.bin"),
                crc32: Some(String::from("8049042f")),
                md5: None,
                mtime: None
            }]
        );
        Ok(())
    }
}
