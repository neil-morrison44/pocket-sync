use rayon::prelude::*;
use reqwest::Url;
use std::io::Read;

async fn download_file(url: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let url = Url::parse(url)?;
    let client = reqwest::Client::new();
    let request = client.head(url.clone()).build()?;
    let response = client.execute(request).await?;

    if !response.status().is_success() {
        return Err(format!("Error downloading file: {}", response.status()).into());
    }
    let supports_range = response.headers().contains_key("Accept-Ranges");
    if !supports_range {
        println!("Server does not support range requests, downloading in a single thread");
        let mut request = client.get(url);
        let response = request.send().await?;
        let mut buffer = Vec::new();
        response.read_to_end(&mut buffer).await?;
        return Ok(buffer);
    }
    let content_length = response.content_length()?;

    let chunk_size = (content_length as f64 / num_cpus::get() as f64).ceil() as usize;

    let ranges = (0..content_length)
        .step_by(chunk_size)
        .map(|start| {
            let end = std::cmp::min(start + chunk_size - 1, content_length - 1);
            format!("bytes={}-{}", start, end)
        })
        .collect::<Vec<_>>()
        .join(", ");
    let mut request = client.get(url);
    if supports_range {
        let content_length = response.content_length().unwrap_or(0);
        let chunk_size = (content_length as f64 / num_cpus::get() as f64).ceil() as usize;
        let ranges = (0..content_length)
            .step_by(chunk_size)
            .map(|start| {
                let end = std::cmp::min(start + chunk_size - 1, content_length - 1);
                format!("bytes={}-{}", start, end)
            })
            .collect::<Vec<_>>()
            .join(", ");
        request = request.header("Range", ranges);
    }
    let response = request.send().await?;
    let mut buffer = Vec::new();
    response.read_to_end(&mut buffer).await?;
    Ok(buffer)
}
