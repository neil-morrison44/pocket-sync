use anyhow::{Error, Result};
use bytes::Bytes;
use rayon::prelude::*;
use reqwest::Url;
use std::{
    cmp::{max, min},
    io::Read,
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

    let has_been_cancelled_clone = has_been_cancelled.clone();
    let file_bytes_result = tokio::task::spawn_blocking(move || {
        let results: Result<Vec<_>, _> = ranges
            .par_iter()
            .map(|(start, end)| {
                download_retry_on_timeout(
                    url.clone(),
                    *start,
                    *end,
                    &progress_tx,
                    &has_been_cancelled_clone,
                )
            })
            .collect();
        results
    })
    .await?;

    match file_bytes_result {
        Ok(chunks) => Ok(chunks.concat().into()),
        Err(e) => {
            if has_been_cancelled.load(Ordering::Relaxed) {
                Ok(Bytes::new())
            } else {
                Err(e)
            }
        }
    }
}

fn download_retry_on_timeout(
    url: Url,
    start: u64,
    end: u64,
    progress_tx: &mpsc::UnboundedSender<ProgressUpdate>,
    has_been_cancelled: &Arc<AtomicBool>,
) -> Result<Bytes> {
    let client = reqwest::blocking::Client::new();
    let mut retry_count = 0;

    let mut current_start = start;
    let mut chunk_data = Vec::with_capacity((end - start + 1) as usize);
    let mut buffer = [0; 65536];

    loop {
        if has_been_cancelled.load(Ordering::Relaxed) {
            return Err(Error::msg("Download cancelled"));
        }

        let request = client
            .get(url.clone())
            .header("Range", format!("bytes={}-{}", current_start, end));

        let mut response = match request.send() {
            Ok(r) => {
                if !r.status().is_success() {
                    return Err(Error::msg(format!("HTTP error: {}", r.status())));
                }
                r
            }
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

        let mut read_error = false;
        loop {
            if has_been_cancelled.load(Ordering::Relaxed) {
                return Err(Error::msg("Download cancelled"));
            }

            match response.read(&mut buffer) {
                Ok(0) => break, // EOF
                Ok(n) => {
                    chunk_data.extend_from_slice(&buffer[..n]);
                    current_start += n as u64;
                    let _ = progress_tx.send(ProgressUpdate::AddBytes(n));
                }
                Err(e) => {
                    println!("Read error midway through chunk: {}, retrying", e);
                    read_error = true;
                    break;
                }
            }
        }

        if read_error {
            if retry_count < 10 {
                retry_count += 1;
                continue;
            } else {
                return Err(Error::msg("Max retries exceeded reading chunk body"));
            }
        }

        if current_start > end {
            return Ok(Bytes::from(chunk_data));
        } else {
            if retry_count < 10 {
                retry_count += 1;
                println!("Premature EOF, resuming remaining bytes");
                continue;
            } else {
                return Err(Error::msg("Premature EOF and max retries exceeded"));
            }
        }
    }
}
