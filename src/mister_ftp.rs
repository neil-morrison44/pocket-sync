pub fn logged_in_ftp(
    host: &str,
    user: &str,
    password: &str,
) -> Result<suppaftp::FtpStream, suppaftp::FtpError> {
    let mut ftp_stream = suppaftp::FtpStream::connect(format!("{host}:21"))?;
    ftp_stream.login(user, password)?;
    Ok(ftp_stream)
}
