use anyhow::Result;
use futures::StreamExt;
use std::path::PathBuf;
use tokio::io::AsyncReadExt;
use tokio::io::AsyncWriteExt;

#[derive(Debug)]
struct Colour {
    red: u8,
    green: u8,
    blue: u8,
}

pub async fn find_all_pal_files(root: &PathBuf) -> Result<Vec<PathBuf>> {
    let mut walker = async_walkdir::WalkDir::new(&root);
    let mut found_files = Vec::new();

    while let Some(Ok(entry)) = walker.next().await {
        match (
            entry.file_type().await,
            entry.path().extension().and_then(|ext| ext.to_str()),
        ) {
            (Ok(f), Some("pal")) if f.is_file() => {
                let path = entry.path();
                found_files.push(path);
            }
            (_, _) => continue,
        }
    }
    Ok(found_files)
}

pub async fn down_convert_pal_to_gbp(pal_file_path: &PathBuf) -> Result<()> {
    let mut pal_file = tokio::fs::File::open(&pal_file_path).await?;
    let mut buffer = [0u8; 12]; // 4 Colours × 3 bytes each
    pal_file.read_exact(&mut buffer).await?;

    let mut colours = Vec::new();
    for chunk in buffer.chunks(3) {
        let colour = Colour {
            red: chunk[0],
            green: chunk[1],
            blue: chunk[2],
        };
        colours.push(colour);
    }

    let mut reversed_bytes = Vec::new();

    // Reverse the order of colours
    for colour in colours.into_iter().rev() {
        reversed_bytes.extend_from_slice(&[colour.red, colour.green, colour.blue]);
    }

    // Add 4 unused bytes (e.g., 0x00)
    reversed_bytes.extend_from_slice(&[0u8; 4]);

    let mut output_path = pal_file_path.clone();
    output_path.set_extension("gbp");

    let mut output_file = tokio::fs::OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .open(output_path)
        .await?;

    output_file.write_all(&reversed_bytes).await?;
    Ok(())
}
