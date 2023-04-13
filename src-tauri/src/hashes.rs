use ring::digest::{Context, Digest, SHA256};
use std::{error, io::Read, path::PathBuf};

pub fn sha256_digest<R: Read>(mut reader: R) -> Result<Digest, Box<dyn error::Error>> {
    let mut context = Context::new(&SHA256);
    let mut buffer = [0; 1024];

    loop {
        let count = reader.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        context.update(&buffer[..count]);
    }

    Ok(context.finish())
}

pub async fn crc32_for_file(file_path: &PathBuf) -> Result<u32, Box<dyn error::Error>> {
    let handle = {
        let full_path = file_path.clone();
        tokio::task::spawn_blocking(move || {
            let mut hasher = crc32fast::Hasher::new();
            let mut file = std::fs::File::open(full_path).unwrap();
            let chunk_size = 0x4000;

            loop {
                let mut chunk = Vec::with_capacity(chunk_size);
                if let Ok(n) = std::io::Read::by_ref(&mut file)
                    .take(chunk_size as u64)
                    .read_to_end(&mut chunk)
                {
                    if n == 0 {
                        break;
                    }
                    hasher.update(&chunk);
                    if n < chunk_size {
                        break;
                    }
                }
            }

            let checksum = hasher.finalize();
            checksum
        })
    };

    let crc32 = handle.await.map_err(|err| err.to_string())?;

    Ok(crc32)
}
