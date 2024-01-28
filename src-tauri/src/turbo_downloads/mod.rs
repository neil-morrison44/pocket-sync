use bytes::Bytes;
use rayon::prelude::*;
use reqwest::Url;
use std::cmp::{max, min};

use crate::result_logger::ResultLogger;

pub async fn turbo_download_file(url: &str, turbo_enabled: bool) -> Result<Option<Bytes>, String> {
    if !turbo_enabled {
        // println!("Turbo downloads disabled, downloading in a single thread");
        return Ok(None);
    }
    // println!("Turbo downloads enabled, downloading in multiple threads");

    let url = Url::parse(url).map_err(|e| format!("Invalid URL: {}", e))?;
    let client = reqwest::Client::new();
    let request = client.head(url.clone()).build().map_err(|e| {
        format!(
            "Error building request to get content length: {}",
            e.to_string()
        )
    })?;
    let response = client.execute(request).await.map_err(|e| {
        format!(
            "Error getting content length from server: {}",
            e.to_string()
        )
    })?;

    if !response.status().is_success() {
        return Err(format!("Error downloading file: {}", response.status()).into());
    }

    match response.headers().contains_key("Accept-Ranges") {
        false => {
            println!("Server does not support range requests, downloading in a single thread");
            return Ok(None);
        }
        true => (),
    }

    let content_length = match response.headers().get("Content-Length") {
        Some(len) => len
            .to_str()
            .unwrap_and_log()
            .parse::<u64>()
            .unwrap_and_log(),
        None => {
            println!("Server does not provide content length, downloading in a single thread");
            return Ok(None);
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
        let file_bytes: Vec<_> = ranges
            .par_iter()
            .map(|(start, end)| {
                dowload_retry_on_timeout(url.clone(), *start, *end).unwrap_and_log()
            })
            .collect();

        file_bytes.concat()
    })
    .await
    .map_err(|e| format!("Error downloading file: {}", e.to_string()))?;
    Ok(Some(file_bytes.into()))
}

fn dowload_retry_on_timeout(
    url: Url,
    start: u64,
    end: u64,
) -> Result<Bytes, Box<dyn std::error::Error>> {
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
