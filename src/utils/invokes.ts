import { invoke } from "@tauri-apps/api/core"
import {
  FileCopy,
  FirmwareInfo,
  RawFeedItem,
  DataSlotFile,
  RootFile,
  SaveZipFile,
  Job,
  PocketPluginInfo,
  PlatformInfoJSON,
  PlatformId,
} from "../types"
import { debug } from "@tauri-apps/plugin-log"
import { path } from "@tauri-apps/api"
import {
  copyFile,
  exists,
  mkdir,
  readDir,
  readFile,
  readTextFile,
  remove,
  stat,
  writeFile,
} from "@tauri-apps/plugin-fs"
import { getDefaultStore } from "jotai"
import { pocketPathAtom } from "../recoil/atoms"
import { join } from "@tauri-apps/api/path"

const store = getDefaultStore()

const toFullPath = async (pocketRelativePath: string) => {
  const basePath = store.get(pocketPathAtom)
  if (!basePath) throw new Error("Pocket folder path is not set.")

  return await join(basePath, pocketRelativePath)
}

export const invokeOpenPocket = async () => invoke<string | null>("open_pocket")

export const invokeOpenPocketFolder = async (path: string) =>
  invoke<string | null>("open_pocket_folder", {
    pocketPath: path,
  })

export const invokeListFiles = async (relativePath: string) => {
  const path = await toFullPath(relativePath)
  const entries = await readDir(path)
  return entries.filter((e) => e.isFile).map((e) => e.name)
}

export const invokeListFolders = async (relativePath: string) => {
  const path = await toFullPath(relativePath)
  const entries = await readDir(path)
  return entries.filter((e) => e.isDirectory).map((e) => e.name)
}

export const invokeReadTextFile = async (relativePath: string) => {
  const path = await toFullPath(relativePath)
  return readTextFile(path)
}

export const invokeReadBinaryFile = async (relativePath: string) => {
  const path = await toFullPath(relativePath)
  return readFile(path)
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

export const invokeSaveFile = async (path: string, buffer: Uint8Array) => {
  try {
    await writeFile(path, buffer)
  } catch (err) {
    return false
  }
  return true
}

export const invokeFileExists = async (relativePath: string) => {
  const path = await toFullPath(relativePath)
  return exists(path)
}

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
  if (!(await exists(path))) {
    await mkdir(path, { recursive: true })
  }
  return true
}

export const invokeDeleteFiles = async (paths: string[]) => {
  await Promise.all(
    paths.map(async (p) => {
      const path = await toFullPath(p)
      return remove(path)
    })
  )
  return true
}

export const invokeCopyFiles = async (copies: FileCopy[]) => {
  await Promise.all(copies.map((c) => copyFile(c.origin, c.destination)))
  return true
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

export const invokeFileMTime = async (relativePath: string) => {
  const path = await toFullPath(relativePath)

  const fileInfo = await stat(path)
  return fileInfo.mtime ? fileInfo.mtime.getTime() : 0
}

export const invokeFilesMTime = async (filePaths: string[]) => {
  const mtime = await invoke<(number | null)[]>("find_mtime_for_files", {
    fullFilePaths: filePaths,
  })

  return mtime.map((mtime, index) => ({
    path: filePaths[index],
    mtime: mtime ? mtime * 1000 : null,
  }))
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
  turbo: boolean,
  jobId?: string
) =>
  await invoke<boolean>("install_archive_files", {
    files,
    archiveUrl,
    turbo,
    jobId,
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

export const invokeConvertAllPalFiles = async () =>
  await invoke<void>("downconvert_all_pal_files")

export const invokeConvertSinglePalFile = async (path: string) =>
  await invoke<void>("downconvert_single_pal_file", { palFilePath: path })

export const invokeMoveGame = async (sourcePath: string, destPath: string) => {
  if (sourcePath.startsWith(path.sep())) sourcePath = sourcePath.substring(1)
  if (destPath.startsWith(path.sep())) destPath = destPath.substring(1)

  await invoke<void>("move_game", { sourcePath, destPath })
}

export const invokeFolderSize = async (folder: string): Promise<number> => {
  return await invoke<number>("get_folder_size", { folder })
}

export const invokeListAndInstallPlugins = async (
  pluginUrls: string[],
  githubToken: string | null
): Promise<PocketPluginInfo[]> => {
  return await invoke<PocketPluginInfo[]>("list_and_install_plugins", {
    pluginUrls,
    githubToken,
  })
}

export const invokeRunPlugin = async (pluginId: string): Promise<void> => {
  return await invoke("run_plugin", {
    pluginId,
  })
}

export const invokeUninstallPlugin = async (
  pluginId: string
): Promise<void> => {
  return await invoke("uninstall_plugin", {
    pluginId,
  })
}

export const invokeKillPlugin = async (pluginId: string): Promise<void> => {
  return await invoke("kill_plugin", {
    pluginId,
  })
}

export const invokeAllPlatformData = async (): Promise<{
  active: Record<string, PlatformInfoJSON["platform"]>
  archived: Record<string, PlatformInfoJSON["platform"]>
}> => {
  return await invoke("all_platform_data")
}

export const invokeArchiveUnarchivePlatforms = async (
  archive: PlatformId[],
  unarchive: PlatformId[]
): Promise<void> => {
  return await invoke("archive_unarchive_platforms", { archive, unarchive })
}

export const invokeReadAllPlatformImages = async (): Promise<
  Record<PlatformId, Uint8Array>
> => {
  const result = await invoke<Record<PlatformId, number[]>>(
    "all_platform_images"
  )
  return Object.fromEntries(
    Object.entries(result).map(([id, data]) => [id, new Uint8Array(data)])
  )
}
