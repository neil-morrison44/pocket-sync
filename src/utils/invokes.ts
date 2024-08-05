import { invoke } from "@tauri-apps/api/core"
import {
  FileCopy,
  FirmwareInfo,
  RawFeedItem,
  DataSlotFile,
  RootFile,
  SaveZipFile,
  Job,
} from "../types"

export const invokeOpenPocket = async () => invoke<string | null>("open_pocket")

export const invokeOpenPocketFolder = async (path: string) =>
  invoke<string | null>("open_pocket_folder", {
    pocketPath: path,
  })

export const invokeListFiles = async (path: string) =>
  invoke<string[]>("list_files", {
    path,
  })

export const invokeListFolders = async (path: string) =>
  invoke<string[]>("list_folders", {
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
  extensions: string[],
  offPocket = false
) => {
  const files = await invoke<string[]>("walkdir_list_files", {
    path,
    extensions,
    offPocket,
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

export const invokeCopyFiles = async (copies: FileCopy[]) => {
  return invoke<boolean>("copy_files", {
    copies: copies.map(({ origin, destination }) => [origin, destination]),
  })
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
  return { timestamp: metadata.timestamp_secs * 1000, crc32: metadata.crc32 }
}

export const invokeFileMTime = async (filePath: string) => {
  const mtime = await invoke<number>("get_file_metadata_mtime_only", {
    filePath,
  })
  return mtime * 1000
}

export const invokeGetFirmwareVersionsList = async () => {
  const firmwares = await invoke<
    {
      version: string
      product: "pocket"
      url: string
      publishedAt: string
    }[]
  >("get_firmware_versions_list")

  const firmwaresWithDates = firmwares.map((f) => ({
    ...f,
    publishedAt: new Date(f.publishedAt),
  }))

  const sortedFirmwares = [...firmwaresWithDates].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  )

  return sortedFirmwares
}

export const invokeGetFirmwareDetails = async (version: string) => {
  const releaseNotes = await invoke<FirmwareInfo>(
    "get_firmware_release_notes",
    { version }
  )
  return releaseNotes
}

export const invokeDownloadFirmware = async (
  url: string,
  fileName: string,
  md5: string
) => {
  return await invoke<boolean>("download_firmware", { url, fileName, md5 })
}

export const invokeClearFileCache = async () => await invoke("clear_file_cache")

export const invokeListRootFiles = async (extensions?: string[]) =>
  await invoke<RootFile[]>("check_root_files", { extensions })

export const invokeFindRequiredFiles = async (
  coreId: string,
  includeAlts: boolean,
  archiveUrl: string
) =>
  await invoke<DataSlotFile[]>("find_required_files", {
    coreId,
    includeAlts,
    archiveUrl,
  })

export const invokeInstallArchiveFiles = async (
  files: DataSlotFile[],
  archiveUrl: string,
  turbo: boolean
) =>
  await invoke<boolean>("install_archive_files", {
    files,
    archiveUrl,
    turbo,
  })

export const invokeSaveMultipleFiles = async (
  paths: string[],
  data: Uint8Array[]
) =>
  await invoke<boolean>("save_multiple_files", {
    paths,
    data: data.map((d) => Array.from(d)),
  })

export const invokeGetActiveJobs = async () =>
  await invoke<Job[]>("get_active_jobs")

export const invokeStopJob = async (jobId: string) =>
  await invoke<Job[]>("stop_job", { jobId })
