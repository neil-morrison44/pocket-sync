use extism::{
    FromBytes, Manifest, PTR, PluginBuilder, ToBytes, UserData, Wasm, convert::Json, host_fn,
};
use log::{debug, error, info, warn};
use reqwest::{Client, header};
use serde::{Deserialize, Serialize};
use std::sync::mpsc;
use sys_locale::get_locale;
use tauri::{Emitter, Listener, Manager};
use tokio::fs;

use crate::{PocketSyncState, app_error::AppError};

#[derive(Deserialize, Default, Debug)]
struct PluginInfo {
    name: String,
    description: Option<String>,
    logo_url: Option<String>,
    allowed_hosts: Vec<String>,
}

#[derive(Clone, Serialize, Deserialize, FromBytes, Debug)]
#[encoding(Json)]
enum PluginMessage {
    Choice {
        name: String,
        query: String,
        choices: Vec<String>,
    },
    Text {
        name: String,
        query: String,
    },
    Exit,
}

#[derive(Clone, Deserialize, Serialize, Debug, ToBytes)]
#[encoding(Json)]
enum HostMessage {
    Answer { name: String, value: String },
    Kill,
}

#[derive(Serialize, Deserialize, Default, Debug)]
struct PluginMeta {
    version: String,
    github_url: String,
}

#[derive(Serialize, Deserialize, Default, Debug)]
pub struct PluginListItem {
    id: String,
    version: String,
    name: String,
    github_url: String,
    logo_url: Option<String>,
    description: Option<String>,
}

#[derive(Deserialize, Debug)]
struct GithubRelease {
    tag_name: String,
    assets: Vec<GithubAsset>,
}

#[derive(Deserialize, Debug)]
struct GithubAsset {
    name: String,
    browser_download_url: String,
}

host_fn!(pub open_url(url: &str) {
  webbrowser::open(url)?;
  Ok(())
});

host_fn!(pub print_msg(window_data: tauri::WebviewWindow; message: String) {
    let window_arc = window_data.get()?;
    let window = window_arc.lock().unwrap();
    let _ = window.emit("plugin-log", message);
    Ok(())
});

#[tauri::command(async)]
pub async fn run_plugin(
    state: tauri::State<'_, PocketSyncState>,
    app_handle: tauri::AppHandle,
    window: tauri::WebviewWindow,
    plugin_id: String,
) -> Result<(), AppError> {
    debug!("Command: run_plugin for {}", plugin_id);

    let pocket_path = state.inner().0.pocket_path.read().await.clone();
    let data_dir = app_handle.path().app_data_dir()?;
    let locale = get_standardized_locale();

    let plugin_data_dir = data_dir.join(&plugin_id);
    let host_path_dir = plugin_data_dir.join("host");
    let json_path = plugin_data_dir.join("plugin.json");

    let file = tokio::fs::File::open(json_path).await?.into_std().await;
    let plugin_info: PluginInfo = serde_json::from_reader(file)?;

    let (tx, rx) = mpsc::channel::<HostMessage>();

    let listen_id = window.listen("plugin-host-message", move |event| {
        if let Ok(message) = serde_json::from_str::<HostMessage>(event.payload()) {
            let _ = tx.send(message);
        }
    });

    let app_handle_clone = app_handle.clone();
    let window_clone = window.clone();
    let plugin_id_clone = plugin_id.clone();

    let blocking_result = tokio::task::spawn_blocking(move || -> Result<(), AppError> {
        let wasm_path = plugin_data_dir.join("plugin.wasm");
        let wasm_file = Wasm::file(wasm_path);

        let manifest = Manifest::new([wasm_file])
            .with_allowed_path(pocket_path.to_string_lossy().to_string(), "pocket")
            .with_allowed_path(host_path_dir.to_string_lossy().to_string(), "host")
            .with_config_key("locale", locale)
            .with_allowed_hosts(plugin_info.allowed_hosts.clone().into_iter());

        let user_data = UserData::new(());

        let mut plugin = PluginBuilder::new(manifest)
            .with_wasi(true)
            .with_function("open_url", [PTR], [PTR], user_data.clone(), open_url)
            .with_function(
                "print_msg",
                [PTR],
                [PTR],
                extism::UserData::new(window_clone.clone()),
                print_msg,
            )
            .build()?;

        let cancel_handle = plugin.cancel_handle();
        let pid_for_insert = plugin_id_clone.clone();

        tokio::spawn(async move {
            let state = app_handle_clone.state::<PocketSyncState>();
            state
                .inner()
                .0
                .active_plugin_handles
                .lock()
                .await
                .insert(pid_for_insert, cancel_handle);
        });

        let res = plugin.call::<Option<()>, PluginMessage>("start", None)?;

        match res {
            PluginMessage::Choice { .. } | PluginMessage::Text { .. } => {
                window_clone.emit("plugin-plugin-message", res)?;
            }
            PluginMessage::Exit => {
                window_clone.emit("plugin-plugin-message", res)?;
                return Ok(());
            }
        }

        while let Ok(message) = rx.recv() {
            let res = plugin.call::<HostMessage, PluginMessage>("handle_response", message)?;

            match res {
                PluginMessage::Choice { .. } | PluginMessage::Text { .. } => {
                    window_clone.emit("plugin-plugin-message", res)?;
                }
                PluginMessage::Exit => {
                    window_clone.emit("plugin-plugin-message", res)?;
                    break;
                }
            }
        }

        Ok(())
    })
    .await;

    state
        .inner()
        .0
        .active_plugin_handles
        .lock()
        .await
        .remove(&plugin_id);

    window.unlisten(listen_id);

    match blocking_result {
        Ok(Ok(_)) => Ok(()),
        Ok(Err(app_error)) => Err(app_error),
        Err(join_err) => {
            error!("Plugin thread panicked: {}", join_err);
            Ok(())
        }
    }
}

#[tauri::command(async)]
pub async fn list_and_install_plugins(
    app_handle: tauri::AppHandle,
    plugin_urls: Vec<String>,
    github_token: Option<String>,
) -> Result<Vec<PluginListItem>, AppError> {
    debug!("Command: list_and_install_plugins");
    let data_dir = app_handle.path().app_data_dir()?;

    let mut headers = header::HeaderMap::new();
    headers.insert(
        header::USER_AGENT,
        header::HeaderValue::from_static("PocketSync-Tauri-App"),
    );
    headers.insert(
        header::ACCEPT,
        header::HeaderValue::from_static("application/vnd.github.v3+json"),
    );

    let auth_header = github_token.and_then(|token| {
        match header::HeaderValue::from_str(&format!("Bearer {}", token)) {
            Ok(val) => Some(val),
            Err(_) => {
                warn!("Provided GitHub token contains invalid characters.");
                None
            }
        }
    });

    let client = Client::builder().default_headers(headers).build()?;
    let mut plugins_list: Vec<PluginListItem> = vec![];

    for plugin_url in plugin_urls {
        let path = plugin_url
            .trim_start_matches("https://")
            .trim_start_matches("http://")
            .trim_start_matches("github.com/");

        let mut parts = path.split('/');
        let owner = parts.next().unwrap_or_default();
        let repo = parts.next().unwrap_or_default();

        if owner.is_empty() || repo.is_empty() {
            warn!("Invalid GitHub URL format, skipping: {}", plugin_url);
            continue;
        }

        let plugin_id = format!("{}-{}", owner, repo);
        let plugin_data_dir = data_dir.join(&plugin_id);

        let api_url = format!(
            "https://api.github.com/repos/{}/{}/releases/latest",
            owner, repo
        );

        let mut req_builder = client.get(&api_url);
        if let Some(ref auth) = auth_header {
            req_builder = req_builder.header(header::AUTHORIZATION, auth.clone());
        }

        let mut release_response = req_builder.send().await?;

        if release_response.status() == reqwest::StatusCode::FORBIDDEN && auth_header.is_some() {
            warn!(
                "403 Forbidden for {}. Retrying without Authorization header...",
                plugin_url
            );
            release_response = client.get(&api_url).send().await?;
        }

        if !release_response.status().is_success() {
            error!(
                "Failed to fetch release for {}: {}",
                plugin_url,
                release_response.status()
            );
            continue;
        }

        if !release_response.status().is_success() {
            error!(
                "Failed to fetch release for {}: {}",
                plugin_url,
                release_response.status()
            );

            continue;
        }

        let release: GithubRelease = release_response.json().await?;
        let latest_version = release.tag_name;

        let meta_path = plugin_data_dir.join("metadata.json");
        let mut needs_update = true;

        if meta_path.exists() {
            if let Ok(meta_str) = fs::read_to_string(&meta_path).await {
                if let Ok(meta) = serde_json::from_str::<PluginMeta>(&meta_str) {
                    if meta.version == latest_version {
                        debug!("Plugin {} is up to date (v{})", plugin_id, latest_version);
                        needs_update = false;
                    }
                }
            }
        }

        if needs_update {
            debug!(
                "Updating/Installing plugin {} to v{}",
                plugin_id, latest_version
            );
            fs::create_dir_all(&plugin_data_dir).await?;

            let wasm_asset = release.assets.iter().find(|a| a.name == "plugin.wasm");
            let json_asset = release.assets.iter().find(|a| a.name == "plugin.json");

            if let (Some(wasm), Some(json)) = (wasm_asset, json_asset) {
                let wasm_bytes = client
                    .get(&wasm.browser_download_url)
                    .send()
                    .await?
                    .bytes()
                    .await?;
                fs::write(plugin_data_dir.join("plugin.wasm"), wasm_bytes).await?;

                let json_bytes = client
                    .get(&json.browser_download_url)
                    .send()
                    .await?
                    .bytes()
                    .await?;
                fs::write(plugin_data_dir.join("plugin.json"), &json_bytes).await?;

                let new_meta = PluginMeta {
                    version: latest_version.clone(),
                    github_url: plugin_url.clone(),
                };
                fs::write(&meta_path, serde_json::to_string_pretty(&new_meta)?).await?;
            } else {
                error!(
                    "Release {} for {} is missing plugin.wasm or plugin.json",
                    latest_version, plugin_id
                );
                continue;
            }
        }

        let host_dir = plugin_data_dir.join("host");
        if !host_dir.exists() {
            fs::create_dir_all(&host_dir).await?;
        }

        let plugin_json_path = plugin_data_dir.join("plugin.json");
        let plugin_info_str = fs::read_to_string(&plugin_json_path).await?;
        let plugin_info: PluginInfo = serde_json::from_str(&plugin_info_str)?;

        plugins_list.push(PluginListItem {
            id: plugin_id,
            version: latest_version,
            name: plugin_info.name,
            github_url: plugin_url,
            logo_url: plugin_info.logo_url,
            description: plugin_info.description,
        });
    }

    Ok(plugins_list)
}

#[tauri::command(async)]
pub async fn uninstall_plugin(
    app_handle: tauri::AppHandle,
    plugin_id: String,
) -> Result<(), AppError> {
    debug!("Command: uninstall_plugin for {}", plugin_id);
    let data_dir = app_handle.path().app_data_dir()?;
    let plugin_data_dir = data_dir.join(&plugin_id);

    if plugin_data_dir.exists() {
        debug!(
            "Found plugin directory for {}. Removing files...",
            plugin_id
        );

        match fs::remove_dir_all(&plugin_data_dir).await {
            Ok(_) => {
                info!("Successfully uninstalled plugin: {}", plugin_id);
                Ok(())
            }
            Err(err) => {
                error!(
                    "Failed to remove plugin directory for {}: {}",
                    plugin_id, err
                );
                Err(err.into())
            }
        }
    } else {
        warn!(
            "Plugin directory not found for {}. Nothing to uninstall.",
            plugin_id
        );
        Ok(())
    }
}

#[tauri::command(async)]
pub async fn kill_plugin(
    state: tauri::State<'_, PocketSyncState>,
    plugin_id: String,
) -> Result<(), AppError> {
    let handle_opt = state
        .inner()
        .0
        .active_plugin_handles
        .lock()
        .await
        .remove(&plugin_id);

    if let Some(handle) = handle_opt {
        let _ = handle.cancel();
    }

    Ok(())
}

fn get_standardized_locale() -> String {
    let raw_locale = get_locale().unwrap_or_else(|| String::from("en-GB"));
    let clean_locale = raw_locale
        .split('.')
        .next()
        .unwrap_or(&raw_locale)
        .split('@')
        .next()
        .unwrap_or(&raw_locale);
    clean_locale.replace('_', "-")
}
