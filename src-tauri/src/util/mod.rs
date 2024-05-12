use anyhow::Result;
use bytes::BytesMut;
use futures::StreamExt as _;
use reqwest::Response;
use std::{
    path::{Path, PathBuf},
    time::SystemTime,
};

pub async fn get_mtime_timestamp(path: &PathBuf) -> Result<u64> {
    let metadata = tokio::fs::metadata(path).await.and_then(|m| m.modified())?;

    let timestamp = metadata
        .duration_since(SystemTime::UNIX_EPOCH)
        .and_then(|d| Ok(d.as_secs()))?;

    Ok(timestamp)
}

// pub type ProgressCallback = impl Fn(total_size: u64, downloaded: u64) -> ();

pub async fn progress_download(
    response: Response,
    mut on_progress: impl FnMut(u64, u64) -> (),
) -> Result<BytesMut> {
    let total_size = response.content_length().unwrap_or(u64::MAX);
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    let mut file = BytesMut::with_capacity(total_size.try_into()?);
    while let Some(Ok(chunk)) = stream.next().await {
        file.extend(&chunk);
        let new = std::cmp::min(downloaded + (chunk.len() as u64), total_size);
        downloaded = new;

        on_progress(total_size, downloaded);
    }
    Ok(file)
}

pub fn find_common_path<'a>(paths: impl IntoIterator<Item = &'a PathBuf>) -> Option<PathBuf> {
    let mut path_iter = paths.into_iter();
    let mut result = path_iter.next()?.to_path_buf();
    for path in path_iter {
        if let Some(r) = common_path(&result, &path) {
            result = r;
        } else {
            return None;
        }
    }
    Some(result.to_path_buf())
}

fn common_path<P, Q>(one: P, two: Q) -> Option<PathBuf>
where
    P: AsRef<Path>,
    Q: AsRef<Path>,
{
    let one = one.as_ref();
    let two = two.as_ref();
    let one = one.components();
    let two = two.components();
    let mut final_path = PathBuf::new();
    let mut found = false;
    let paths = one.zip(two);
    for (l, r) in paths {
        if l == r {
            final_path.push(l.as_os_str());
            found = true;
        } else {
            break;
        }
    }
    if found {
        Some(final_path)
    } else {
        None
    }
}
