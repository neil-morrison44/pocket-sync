import { selector, selectorFamily } from "recoil"
import { ArchiveFileMetadata, RequiredFileInfo, RootFile } from "../../types"
import { PocketSyncConfigSelector } from "../config/selectors"
import { archiveBumpAtom } from "./atoms"
import {
  invokeFileExists,
  invokeFileMTime,
  invokeListRootFiles,
  invokeWalkDirListFiles,
} from "../../utils/invokes"
import { ResponseType, getClient } from "@tauri-apps/api/http"
import { pocketPathAtom } from "../atoms"
import { FolderWatchAtomFamily } from "../fileSystem/atoms"

export const ArchiveMetadataSelectorFamily = selectorFamily<
  ArchiveFileMetadata[],
  { archiveName: string }
>({
  key: "ArchiveMetadataSelectorFamily",
  get:
    ({ archiveName }) =>
    async ({ get }) => {
      get(archiveBumpAtom)
      const httpClient = await getClient()
      const response = await httpClient.get<{
        files: ArchiveFileMetadata[]
      }>(`https://archive.org/metadata/${archiveName}`, {
        responseType: ResponseType.JSON,
      })

      const { files } = response.data
      return files
    },
})

export const PathFileInfoSelectorFamily = selectorFamily<
  Omit<RequiredFileInfo, "type">[],
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
          const mtime = exists ? await invokeFileMTime(fullPath) : undefined

          return {
            filename,
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
