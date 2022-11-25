use data_encoding::HEXUPPER;
use ring::digest::{Context, Digest, SHA256};
use serde::{Deserialize, Serialize};
use std::{
    cmp::{Ord, Ordering},
    error,
    fs::{self, File},
    io::{BufReader, Cursor, Read, Write},
    path::{Path, PathBuf},
    time::SystemTime,
};
use tempdir::TempDir;
use walkdir::WalkDir;
use zip::{write::FileOptions, DateTime};

#[derive(Eq, PartialEq, PartialOrd, Serialize, Deserialize)]
pub struct SaveZipFile {
    last_modified: u32,
    hash: String,
    filename: String,
}

impl Ord for SaveZipFile {
    fn cmp(&self, other: &Self) -> Ordering {
        self.last_modified.cmp(&other.last_modified)
    }
}

static FILE_PREFIX: &str = "pocket-sync-save-backup__";

pub fn restore_save_from_zip(zip_path: &PathBuf, file_path: &str, pocket_path: &PathBuf) -> () {
    let zip_file = fs::read(zip_path).unwrap();
    let cursor = Cursor::new(zip_file);
    let mut archive = zip::ZipArchive::new(cursor).unwrap();

    let tmp_dir = TempDir::new("zip_saves_tmp").unwrap();
    let tmp_path = tmp_dir.into_path();
    archive.extract(&tmp_path).unwrap();

    let src_file_path = tmp_path.join(remove_leading_slash(file_path));
    let dest_file_path = pocket_path
        .join("Saves")
        .join(remove_leading_slash(file_path));

    // println!("from {:?} to {:?}", src_file_path, dest_file_path);

    fs::create_dir_all(dest_file_path.parent().unwrap()).unwrap();
    fs::copy(&src_file_path, &dest_file_path).unwrap();
}

pub fn read_saves_in_zip(zip_path: &PathBuf) -> Result<Vec<SaveZipFile>, ()> {
    let zip_file = fs::read(zip_path).unwrap();
    let cursor = Cursor::new(zip_file);
    let mut archive = zip::ZipArchive::new(cursor).unwrap();

    let tmp_dir = TempDir::new("zip_saves_tmp").unwrap();
    let tmp_path = tmp_dir.into_path();
    archive.extract(&tmp_path).unwrap();

    read_saves_in_folder(&tmp_path)
}

pub fn read_saves_in_folder(folder_path: &PathBuf) -> Result<Vec<SaveZipFile>, ()> {
    let walker = WalkDir::new(&folder_path).into_iter();
    let dir_path_str = &folder_path.to_str().unwrap();
    Ok(walker
        .into_iter()
        .filter_map(|x| x.ok())
        .filter(|e| e.path().is_file())
        .map(|e| {
            let file_path = e.path();
            let metadata = file_path.metadata().unwrap();
            let last_modified = time::OffsetDateTime::from(metadata.created().unwrap());

            let input = File::open(file_path).unwrap();
            let reader = BufReader::new(input);
            let digest = sha256_digest(reader).unwrap();

            SaveZipFile {
                filename: String::from(e.path().to_str().unwrap()).replace(dir_path_str, ""),
                last_modified: last_modified.unix_timestamp().try_into().unwrap(),
                hash: HEXUPPER.encode(&digest.as_ref()),
            }
        })
        .collect())
}

pub fn read_save_zip_list(dir_path: &PathBuf) -> Result<Vec<SaveZipFile>, ()> {
    if !dir_path.exists() {
        return Ok(vec![]);
    }
    let paths = fs::read_dir(dir_path).unwrap();
    Ok(paths
        .into_iter()
        .filter(Result::is_ok)
        .map(|p| p.unwrap())
        .map(|p| p.file_name().into_string().unwrap())
        .filter(|s| s.starts_with(FILE_PREFIX))
        .map(|filename| {
            let file_path = dir_path.join(&filename);
            let metadata = file_path.metadata().unwrap();
            let last_modified = time::OffsetDateTime::from(metadata.modified().unwrap());

            let input = File::open(file_path).unwrap();
            let reader = BufReader::new(input);
            let digest = sha256_digest(reader).unwrap();

            SaveZipFile {
                filename,
                last_modified: last_modified.unix_timestamp().try_into().unwrap(),
                hash: HEXUPPER.encode(&digest.as_ref()),
            }
        })
        .collect())
}

pub fn build_save_zip(
    pocket_path: &PathBuf,
    save_paths: Vec<&str>,
    dir_path: &str,
    max_count: usize,
) -> Result<(), ()> {
    let zip_path = Path::new(dir_path);
    let timestamp = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let filename = format!("{FILE_PREFIX}{timestamp}.zip");
    let zip_file_path = zip_path.join(filename);
    let zip_file = File::create(zip_file_path).unwrap();

    let mut zip = zip::ZipWriter::new(zip_file);
    let options = FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    let saves_path = pocket_path.join("Saves");

    let mut buffer = Vec::new();
    for name in save_paths {
        let path = saves_path.join(name);
        let metadata = path.metadata().unwrap();
        let last_modified = time::OffsetDateTime::from(metadata.modified().unwrap());

        let file_options = options.last_modified_time(
            DateTime::from_date_and_time(
                last_modified.year().try_into().unwrap(),
                last_modified.month().try_into().unwrap(),
                last_modified.day(),
                last_modified.hour(),
                last_modified.minute(),
                last_modified.second(),
            )
            .unwrap(),
        );

        if path.is_file() {
            zip.start_file(name, file_options).unwrap();
            let mut f = File::open(path).unwrap();
            f.read_to_end(&mut buffer).unwrap();
            zip.write_all(&*buffer).unwrap();
            buffer.clear();
        } else {
            zip.add_directory(name, options).unwrap();
        }
    }
    zip.finish().unwrap();

    let files = read_save_zip_list(&PathBuf::from(zip_path)).unwrap();

    if files.len() > max_count {
        let oldest_file = files.iter().min().unwrap();
        let last_file_path = zip_path.join(&oldest_file.filename);
        fs::remove_file(last_file_path).unwrap();
    }
    Ok(())
}

fn remove_leading_slash(value: &str) -> &str {
    if !value.starts_with("/") {
        return value;
    }

    let mut chars = value.chars();
    chars.next();
    chars.as_str()
}

fn sha256_digest<R: Read>(mut reader: R) -> Result<Digest, Box<dyn error::Error>> {
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
