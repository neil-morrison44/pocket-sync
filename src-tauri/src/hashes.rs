use data_encoding::HEXLOWER;
use ring::digest::{Context, Digest, SHA1_FOR_LEGACY_USE_ONLY, SHA256};
use std::{
    error,
    fs::File,
    io::{BufReader, Read},
    path::PathBuf,
};

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

pub fn sha1_digest<R: Read>(mut reader: R) -> Result<Digest, Box<dyn error::Error>> {
    let mut context = Context::new(&SHA1_FOR_LEGACY_USE_ONLY);
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

pub fn sha1_for_file(file_path: &PathBuf) -> Result<String, Box<dyn error::Error>> {
    let input = File::open(file_path)?;
    let reader = BufReader::new(input);
    let digest = sha1_digest(reader)?;

    Ok(HEXLOWER.encode(&digest.as_ref()))
}
