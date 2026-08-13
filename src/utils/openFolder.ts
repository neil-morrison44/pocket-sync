import { path } from "@tauri-apps/api"
import { openPath } from "@tauri-apps/plugin-opener"

export const openFolder = async (folderPath: string) => {
  const sep = path.sep()
  const platformPath = folderPath.replace(":\\/", ":\\").replaceAll("/", sep)
  openPath(platformPath)
}
