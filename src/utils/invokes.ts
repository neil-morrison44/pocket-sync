import { invoke } from "@tauri-apps/api"
import { RawFeedItem, SaveZipFile } from "../types"

export const invokeOpenPocket = async () => invoke<string | null>("open_pocket")

export const invokeListFiles = async (path: string) =>
  invoke<string[]>("list_files", {
    path,
  })

export const invokeReadTextFile = async (path: string) =>
  invoke<string>("read_text_file", {
    path,
  })

export const invokeReadBinaryFile = async (path: string) => {
  const file = await invoke<number[]>("read_binary_file", {
    path,
  })
  return new Uint8Array(file)
}

export const invokeWalkDirListFiles = async (
  path: string,
  extensions: string[]
) => {
  const files = await invoke<string[]>("walkdir_list_files", {
    path,
    extensions,
  })
  files.sort((a, b) => a.localeCompare(b))
  return files
}

export const invokeSaveFile = async (path: string, buffer: Uint8Array) =>
  invoke<boolean>("save_file", {
    path,
    buffer: Array.prototype.slice.call(buffer),
  })

export const invokeFileExists = async (path: string) =>
  invoke<boolean>("file_exists", {
    path,
  })

export const invokeSHA1Hash = async (path: string) =>
  invoke<string>("file_sha1_hash", {
    path,
  })

export const invokeUninstallCore = async (coreName: string) =>
  invoke<boolean>("uninstall_core", {
    coreName,
  })

export const invokeBackupSaves = async (
  savePaths: string[],
  zipPath: string,
  maxCount: number
) => invoke<boolean>("backup_saves", { savePaths, zipPath, maxCount })

export const invokeListBackupSaves = async (backupPath: string) => {
  const { files, exists } = await invoke<{
    files: SaveZipFile[]
    exists: boolean
  }>("list_backup_saves", {
    backupPath,
  })
  return {
    files: [...files].sort((a, b) => a.last_modified - b.last_modified),
    exists,
  }
}

export const invokeListSavesInZip = async (zipPath: string) => {
  return invoke<SaveZipFile[]>("list_saves_in_zip", { zipPath })
}

export const invokeListSavesOnPocket = async () => {
  return invoke<SaveZipFile[]>("list_saves_on_pocket", {})
}

export const invokeRestoreZip = async (zipPath: string, filePath: string) => {
  return invoke<null>("restore_save", { zipPath, filePath })
}

export const invokeCreateFolderIfMissing = async (path: string) => {
  return invoke<boolean>("create_folder_if_missing", { path })
}

export const invokeDeleteFiles = async (paths: string[]) => {
  return invoke<boolean>("delete_files", { paths })
}

export const invokeFindCleanableFiles = async (path: string) => {
  return invoke<string[]>("find_cleanable_files", { path })
}

export const invokeListInstancePackageableCores = async () => {
  return invoke<string[]>("list_instance_packageable_cores")
}

export const invokeRunPackagerForCore = async (coreName: string) => {
  return invoke<null>("run_packager_for_core", { coreName })
}

export const invokeGetNewsFeed = async () => {
  return invoke<RawFeedItem[]>("get_news_feed")
}

export const invokeBeginMisterSaveSyncSession = async (
  host: string,
  user: string,
  password: string
) => {
  return invoke<boolean>("begin_mister_sync_session", { host, user, password })
}

export const invokeFileMetadata = async (filePath: string) => {
  const metadata = await invoke<{ timestamp_secs: number; crc32: number }>(
    "get_file_metadata",
    {
      filePath,
    }
  )
  console.log({ metadata })
  return { timestamp: metadata.timestamp_secs * 1000, crc32: metadata.crc32 }
}
