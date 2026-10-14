import { path } from "@tauri-apps/api"
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener"

export const openFolder = async (folderPath: string) => {
  const sep = path.sep()
  const platformPath = folderPath.replace(":\\/", ":\\").replaceAll("/", sep)
  openPath(platformPath)
}

/** Opens the file's folder in Finder / Explorer with the file selected. */
export const revealFile = async (filePath: string) => {
  const sep = path.sep()
  const platformPath = filePath.replace(":\\/", ":\\").replaceAll("/", sep)
  revealItemInDir(platformPath)
}
