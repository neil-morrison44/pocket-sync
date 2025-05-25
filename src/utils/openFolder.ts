import { path } from "@tauri-apps/api"
import { open } from "@tauri-apps/plugin-shell"

export const openFolder = async (folderPath: string) => {
  const sep = path.sep()
  const platformPath = folderPath.replaceAll("/", sep)
  open(platformPath)
}
