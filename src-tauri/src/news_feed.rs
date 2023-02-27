use bytes::Buf;
use feed_rs::parser;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct FeedItem {
    title: String,
    link: String,
    published: i64,
    content: String,
    categories: Vec<String>,
}

pub async fn get_feed_json() -> Vec<FeedItem> {
    let feed_url = "https://openfpga-cores-inventory.github.io/analogue-pocket/feed.xml";
    let response = reqwest::get(feed_url).await;

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
                let content = r.bytes().await.unwrap();
                let feed = parser::parse(content.reader()).unwrap();

                // dbg!(&feed.entries);

                let items: Vec<FeedItem> = feed
                    .entries
                    .into_iter()
                    .map(|entry| {
                        let title = entry
                            .title
                            .and_then(|t| Some(t.content))
                            .or_else(|| Some(String::from("Unknown")))
                            .unwrap();

                        let content = entry
                            .content
                            .and_then(|c| c.body)
                            .or_else(|| Some(String::from("")))
                            .unwrap();

                        let published = entry.published.unwrap();

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
