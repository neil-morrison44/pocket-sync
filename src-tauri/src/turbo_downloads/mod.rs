use anyhow::{Error, Result};
use bytes::Bytes;
use rayon::prelude::*;
use reqwest::Url;
use std::{
    cmp::{max, min},
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
};
use tokio::sync::mpsc;

use crate::commands::archive::ProgressUpdate;

pub async fn turbo_download_file(
    url: &str,
    progress_tx: mpsc::UnboundedSender<ProgressUpdate>,
    has_been_cancelled: Arc<AtomicBool>,
) -> Result<Bytes> {
    let url = Url::parse(url)?;
    let client = reqwest::Client::new();
    let request = client.head(url.clone()).build()?;
    let response = client.execute(request).await?;

    if !response.status().is_success() {
        return Err(Error::msg(format!(
            "Error downloading file: {}",
            response.status()
        )));
    }

    if !response.headers().contains_key("Accept-Ranges") {
        return Err(Error::msg("API doesn't support \"Accept-Ranges\""));
    }

    let content_length = match response.headers().get("Content-Length") {
        Some(len) => len.to_str().unwrap().parse::<u64>().unwrap(),
        None => {
            return Err(Error::msg("API didn't return \"Content-Length\""));
        }
    };

    let max_chunk_count = min(8, num_cpus::get()) as u64;
    let min_chunk_size: u64 = 512 * 1024;
    let chunk_size = max(content_length / max_chunk_count as u64, min_chunk_size);

    let mut ranges = Vec::new();
    for i in (0..content_length).step_by(chunk_size as usize) {
        let start = i;
        let end = min(i + chunk_size, content_length) - 1;
        ranges.push((start, end));
    }

    let file_bytes = tokio::task::spawn_blocking(move || {
        // 2. Map over the iter returning a Result, which allows Rayon to short-circuit
        let results: Result<Vec<_>, _> = ranges
            .par_iter()
            .map(|(start, end)| {
                if has_been_cancelled.load(Ordering::Relaxed) {
                    return Err(Error::msg("Download cancelled"));
                }

                let bytes = download_retry_on_timeout(url.clone(), *start, *end)
                    .map_err(|_| Error::msg("Chunk download failed"))?;

                if has_been_cancelled.load(Ordering::Relaxed) {
                    return Err(Error::msg("Download cancelled"));
                }

                let _ = progress_tx.send(ProgressUpdate::AddBytes(bytes.len()));
                Ok(bytes)
            })
            .collect();
        results.map(|chunks| chunks.concat())
    })
    .await??;

    Ok(file_bytes.into())
}

fn download_retry_on_timeout(url: Url, start: u64, end: u64) -> Result<Bytes> {
    let client = reqwest::blocking::Client::new();
    let mut retry_count = 0;
    loop {
        let mut request = client.get(url.clone());
        request = request.header("Range", format!("bytes={}-{}", start, end));
        match request.send().and_then(|r| r.bytes()) {
            Ok(b) => return Ok(b),
            Err(err) if err.is_timeout() || err.is_decode() => {
                if retry_count < 10 {
                    retry_count += 1;
                    println!("Error downloading file: {}, retrying", err);
                    continue;
                } else {
                    return Err(err.into());
                }
            }
            Err(e) => {
                println!("non-timeout error: {}", e);
                return Err(e.into());
            }
        };
    }
}
