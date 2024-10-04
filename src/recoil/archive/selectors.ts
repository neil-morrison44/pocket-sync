import { selector, selectorFamily } from "recoil"
import {
  ArchiveFileMetadata,
  FetchFileMetadataWithStatus,
  RootFile,
} from "../../types"
import { PocketSyncConfigSelector } from "../config/selectors"
import { archiveBumpAtom } from "./atoms"
import {
  invokeFileExists,
  invokeFileMTime,
  invokeListRootFiles,
  invokeWalkDirListFiles,
} from "../../utils/invokes"
import { fetch as tauriFecth } from "@tauri-apps/plugin-http"

import { pocketPathAtom } from "../atoms"
import { FolderWatchAtomFamily } from "../fileSystem/atoms"

export const ArchiveMetadataSelectorFamily = selectorFamily<
  null | ArchiveFileMetadata[],
  { archiveName: string }
>({
  key: "ArchiveMetadataSelectorFamily",
  get:
    ({ archiveName }) =>
    async ({ get }) => {
      get(archiveBumpAtom)
      const response = await tauriFecth(
        `https://archive.org/metadata/${archiveName}`,
        {
          method: "GET",
        }
      )

      const data = (await response.json()) as {
        files?: ArchiveFileMetadata[]
      }

      if (!data.files) return null
      return data.files
    },
})

export const PathFileInfoSelectorFamily = selectorFamily<
  FetchFileMetadataWithStatus[],
  { path: string; offPocket?: boolean }
>({
  key: "PathFileInfoSelectorFamily",
  get:
    ({ path, offPocket }) =>
    async ({ get }) => {
      get(FolderWatchAtomFamily(path))
      const pocketPath = get(pocketPathAtom)
      const fileList = await invokeWalkDirListFiles(path, [], offPocket)

      const all = await Promise.all(
        fileList.map(async (filename) => {
          const fullPath = offPocket
            ? `${path}/${filename}`
            : `${pocketPath}/${path}/${filename}`

          const exists = await invokeFileExists(fullPath)
          const mtime = exists ? await invokeFileMTime(fullPath) : 0

          return {
            name: filename,
            path,
            exists,
            mtime,
          }
        })
      )

      return all
    },
})

export const archiveMetadataUrlSelector = selector<string | "">({
  key: "archiveMetadataUrlSelector",
  get: ({ get }) => {
    get(archiveBumpAtom)
    const config = get(PocketSyncConfigSelector)
    if (!config.archive_url) return ""

    let url = config.archive_url.replace("download", "metadata")
    if (url.includes("updater.")) url = url + "/updater.php"

    return url
  },
})

export const ListSomeRootFilesSelectorFamily = selectorFamily<
  RootFile[],
  string[]
>({
  key: "ListSomeRootFilesSelectorFamily",
  get:
    (extensions) =>
    async ({ get }) => {
      get(FolderWatchAtomFamily("/"))
      const rootFileInfo = await invokeListRootFiles(extensions)
      return rootFileInfo
    },
})
