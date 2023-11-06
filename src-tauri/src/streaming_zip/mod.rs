use core::panic;
use reqwest::blocking::Client;
use reqwest::Url;

pub struct ZipStream {
    url: String,
    content_length: Option<u64>,
    position: u64,
    partial_file: Vec<Option<u8>>,
}

impl ZipStream {
    pub fn new(url: String) -> Self {
        let parsed_url = Url::parse(&url)
            .map_err(|e| format!("Invalid URL: {}", e))
            .unwrap();
        let client = Client::new();
        let request = client.head(parsed_url.clone()).build().unwrap();
        let response = client.execute(request).unwrap();

        let content_length = match response.headers().get("Content-Length") {
            Some(len) => len.to_str().unwrap().parse::<u64>().unwrap(),
            None => 0,
        };

        Self {
            url,
            content_length: Some(content_length),
            position: 0,
            partial_file: vec![None; content_length as usize],
        }
    }

    fn fill_from_cache(&mut self, buf: &mut [u8]) -> Option<usize> {
        if self.partial_file[self.position as usize..(self.position + buf.len() as u64) as usize]
            .iter()
            .all(|x| x.is_some())
        {
            let bytes_to_read = buf
                .len()
                .min(self.content_length.unwrap() as usize - self.position as usize);
            // println!(
            //     "reading {} bytes from {} starting at {}",
            //     bytes_to_read, self.url, self.position
            // );
            let bytes = self.partial_file
                [self.position as usize..(self.position + bytes_to_read as u64) as usize]
                .iter()
                .map(|x| x.unwrap())
                .collect::<Vec<u8>>();
            let bytes: &[u8] = bytes.as_ref();

            let bytes_read = bytes.len();
            buf[..bytes_read].copy_from_slice(bytes);
            self.position += bytes_read as u64;

            return Some(bytes_read);
        }

        return None;
    }
}

impl std::io::Read for ZipStream {
    fn read(&mut self, buf: &mut [u8]) -> Result<usize, std::io::Error> {
        match self.fill_from_cache(buf) {
            Some(bytes_read) => {
                // println!("read {} bytes from cache", bytes_read);
                return Ok(bytes_read);
            }
            None => {}
        }

        let url = Url::parse(&self.url)
            .map_err(|e| format!("Invalid URL: {}", e))
            .unwrap();
        let client = Client::new();
        let bytes_to_read = buf
            .len()
            .min(self.content_length.unwrap() as usize - self.position as usize);
        // println!(
        //     "reading {} bytes from {} starting at {}",
        //     bytes_to_read, self.url, self.position
        // );

        let start = (self.position as i64 - 1024_000).max(0);
        let end = (self.position + bytes_to_read as u64 + 1024_000)
            .min(self.content_length.unwrap() as u64);

        let request = client
            .get(url.clone())
            .header("Range", format!("bytes={}-{}", (start), (end - 1)))
            .build()
            .unwrap();
        let response = client.execute(request).unwrap();

        let bytes = response.bytes().unwrap();
        let bytes = bytes.as_ref();

        self.partial_file[(start as usize)..(end as usize)]
            .copy_from_slice(bytes.iter().map(|x| Some(*x)).collect::<Vec<_>>().as_ref());
        //self.position += bytes_read as u64;

        match self.fill_from_cache(buf) {
            Some(bytes_read) => return Ok(bytes_read),
            None => {
                panic!("Failed to read from cache");
            }
        }
    }
}

impl std::io::Seek for ZipStream {
    fn seek(&mut self, pos: std::io::SeekFrom) -> Result<u64, std::io::Error> {
        match pos {
            std::io::SeekFrom::Start(pos) => {
                self.position = pos;
                Ok(self.position)
            }
            std::io::SeekFrom::End(pos) => {
                let new = self.content_length.unwrap() as i64 + pos;
                self.position = new as u64;
                Ok(self.position)
            }
            std::io::SeekFrom::Current(pos) => {
                let new = self.position as i64 + pos;
                self.position = new as u64;
                Ok(self.position)
            }
        }
    }
}
