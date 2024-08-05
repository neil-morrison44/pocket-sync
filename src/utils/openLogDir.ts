/// |Platform | Value                                         | Example                                        |
/// | ------- | --------------------------------------------- | ---------------------------------------------- |
/// | Linux   | `{configDir}/{bundleIdentifier}`              | `/home/alice/.config/com.tauri.dev`            |
/// | macOS   | `{homeDir}/Library/Logs/{bundleIdentifier}`   | `/Users/Alice/Library/Logs/com.tauri.dev`      |
/// | Windows | `{configDir}/{bundleIdentifier}`              | `C:\Users\Alice\AppData\Roaming\com.tauri.dev` |

import { platform } from "@tauri-apps/plugin-os"
import { configDir, homeDir } from "@tauri-apps/api/path"
import { open } from "@tauri-apps/plugin-shell"

export const openLogDir = async () => {
  const platformName = await platform()
  const configDirPath = await configDir()
  const homeDirPath = await homeDir()
  const bundleId = "today.neil.pocket-sync"

  const path = (() => {
    switch (platformName) {
      case "windows":
        return `${configDirPath}/${bundleId}`
      case "macos":
        return `${homeDirPath}/Library/Logs/${bundleId}`
      case "linux":
        return `${configDirPath}/${bundleId}`
      default:
        return null
    }
  })()

  if (path) open(path)
}
