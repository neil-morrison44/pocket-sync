use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{Emitter, Listener};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PathStatus {
    pub path: String,
    pub exists: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ZipInstallProgress {
    pub max: usize,
    pub value: usize,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum FromRustPayload {
    InstallZipEvent {
        title: String,
        files: Option<Vec<PathStatus>>,
        progress: Option<ZipInstallProgress>,
    },
    ReplaceConfirmEvent {
        previous_core_names: Vec<String>,
    },
    ZipInstallFinished {
        error: Option<String>,
    },
    DownloadProgress {
        url: String,
        downloaded: u64,
        total_size: u64,
    },
}

impl FromRustPayload {
    pub fn emit(&self, window: &tauri::WebviewWindow) -> Result<(), tauri::Error> {
        match self {
            FromRustPayload::InstallZipEvent { .. } => window.emit("install-zip-event", &self),
            FromRustPayload::ReplaceConfirmEvent { .. } => {
                window.emit("replace-confirm-request", &self)
            }
            FromRustPayload::ZipInstallFinished { .. } => {
                window.emit("install-zip-finished", &self)
            }
            FromRustPayload::DownloadProgress { .. } => {
                window.emit("install-zip-download-progress", &self)
            }
        }
    }

    pub async fn wait_for_confirmation(
        &self,
        window: &tauri::WebviewWindow,
    ) -> Result<FromTSPayload, Box<dyn std::error::Error>> {
        let listen_name = match self {
            FromRustPayload::InstallZipEvent { .. } => "install-confirmation",
            FromRustPayload::ReplaceConfirmEvent { .. } => "replace-confirm-response",
            _ => panic!("Attempt to wait for error confirmation"),
        };

        self.emit(&window).unwrap();
        let (tx, rx) = tokio::sync::oneshot::channel();
        window.once(listen_name, move |event| {
            let install_confirm: FromTSPayload = serde_json::from_str(event.payload()).unwrap();
            tx.send(install_confirm).unwrap();
        });

        let install_confirm = rx.await?;
        Ok(install_confirm)
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum FromTSPayload {
    InstallConfirmation {
        paths: Vec<PathBuf>,
        handle_moved_files: bool,
        allow: bool,
    },
    ReplaceConfirmation {
        allow: bool,
    },
}
