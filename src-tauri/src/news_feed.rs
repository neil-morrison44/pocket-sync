use bytes::Buf;
use feed_rs::parser;
use serde::{Deserialize, Serialize};
use std::time::SystemTime;

use crate::result_logger::{OptionLogger, ResultLogger};

#[derive(Serialize, Deserialize)]
pub struct FeedItem {
    title: String,
    link: String,
    published: i64,
    content: String,
    categories: Vec<String>,
}

pub async fn get_feed_json() -> Vec<FeedItem> {
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_and_log()
        .as_millis();

    let feed_url = format!(
        "https://openfpga-cores-inventory.github.io/analogue-pocket/feed.xml?cache_bust={now}"
    );
    let response = reqwest::get(&feed_url).await;

    match response {
        Err(e) => {
            println!("Error downloading from {feed_url}: ({e})");
            return vec![];
        }
        Ok(r) => {
            if r.status() != 200 {
                println!("Error downloading from {feed_url}: ({})", r.status());
                return vec![];
            } else {
                let content = r.bytes().await.unwrap_and_log();
                let feed = parser::parse(content.reader()).unwrap_and_log();

                // dbg!(&feed.entries);

                let items: Vec<FeedItem> = feed
                    .entries
                    .into_iter()
                    .map(|entry| {
                        let title = entry
                            .title
                            .and_then(|t| Some(t.content))
                            .or_else(|| Some(String::from("Unknown")))
                            .unwrap_and_log();

                        let content = entry
                            .content
                            .and_then(|c| c.body)
                            .or_else(|| Some(String::from("")))
                            .unwrap_and_log();

                        let published = entry.published.unwrap_and_log();

                        let categories: Vec<String> =
                            entry.categories.into_iter().map(|c| c.term).collect();

                        FeedItem {
                            title,
                            link: String::from(""),
                            published: published.timestamp_millis(),
                            content,
                            categories,
                        }
                    })
                    .collect();

                return items;
            }
        }
    }
}
