import { openFolder } from "./openFolder"
import { appLogDir } from "@tauri-apps/api/path"

export const openLogDir = async () => {
  try {
    const path = await appLogDir()

    if (path) openFolder(path)
  } catch (err) {
    console.error("Failed to resolve log directory:", err)
  }
}
