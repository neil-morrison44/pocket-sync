import { invoke } from "@tauri-apps/api"
import { SaveBackupPathTime } from "../types"

export const invokeOpenPocket = async () => invoke<string | null>("open_pocket")

export const invokeListFiles = async (path: string) =>
  invoke<string[]>("list_files", {
    path,
  })

export const invokeReadTextFile = async (path: string) =>
  invoke<string>("read_text_file", {
    path,
  })

export const invokeReadBinaryFile = async (path: string) =>
  invoke<Uint8Array>("read_binary_file", {
    path,
  })

export const invokeWalkDirListFiles = async (
  path: string,
  extensions: string[]
) =>
  invoke<string[]>("walkdir_list_files", {
    path,
    extensions,
  })

export const invokeSaveFile = async (path: string, buffer: Uint8Array) =>
  invoke<boolean>("save_file", {
    path,
    buffer: Array.prototype.slice.call(buffer),
  })

export const invokeFileExists = async (path: string) =>
  invoke<boolean>("file_exists", {
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
  console.log({ backupPath })
  const backups = await invoke<SaveBackupPathTime[]>("list_backup_saves", {
    backupPath,
  })
  return [...backups].sort((a, b) => a.last_modified - b.last_modified)
}

export const invokeListSavesInZip = async (zipPath: string) => {
  return invoke<SaveBackupPathTime[]>("list_saves_in_zip", { zipPath })
}

export const invokeRestoreZip = async (zipPath: string, filePath: string) => {
  return invoke<null>("restore_save", { zipPath, filePath })
}
