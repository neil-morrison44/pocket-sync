import { selector, selectorFamily } from "recoil"
import { ArchiveFileMetadata, RequiredFileInfo, RootFile } from "../../types"
import { PocketSyncConfigSelector } from "../config/selectors"
import { RequiredFileInfoSelectorFamily } from "../requiredFiles/selectors"
import { archiveBumpAtom } from "./atoms"
import {
  invokeFileExists,
  invokeFileMetadata,
  invokeListRootFiles,
  invokeWalkDirListFiles,
} from "../../utils/invokes"
import { ResponseType, getClient } from "@tauri-apps/api/http"
import { fileSystemInvalidationAtom, pocketPathAtom } from "../atoms"

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
        timeout: 30,
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
      get(fileSystemInvalidationAtom)
      const pocketPath = get(pocketPathAtom)
      const fileList = await invokeWalkDirListFiles(path, [], offPocket)

      const all = await Promise.all(
        fileList.map(async (filename) => {
          const fullPath = offPocket
            ? `${path}/${filename}`
            : `${pocketPath}/${path}/${filename}`

          const exists = await invokeFileExists(fullPath)
          const crc32 = exists
            ? (await invokeFileMetadata(fullPath)).crc32
            : undefined

          return {
            filename,
            path,
            exists,
            crc32,
          }
        })
      )

      return all
    },
})

const archiveMetadataSelector = selector<ArchiveFileMetadata[]>({
  key: "archiveMetadataSelector",
  get: async ({ get }) => {
    get(archiveBumpAtom)
    const config = get(PocketSyncConfigSelector)
    if (!config.archive_url) return []

    let url = config.archive_url.replace("download", "metadata")
    if (url.includes("updater.")) url = url + "/updater.php"

    const httpClient = await getClient()
    const response = await httpClient.get<{
      files: ArchiveFileMetadata[]
    }>(url, {
      timeout: 30,
      responseType: ResponseType.JSON,
    })

    // const { files } = (await (await fetch(url)).json()) as {
    //   files: ArchiveFileMetadata[]
    // }
    const { files } = response.data
    return files
  },
})

export const RequiredFilesWithStatusSelectorFamily = selectorFamily<
  RequiredFileInfo[],
  string
>({
  key: "requiredFilesWithStatus",
  get:
    (coreName: string) =>
    async ({ get }) => {
      const archiveMetadata = get(archiveMetadataSelector)
      const requiredFiles = get(RequiredFileInfoSelectorFamily(coreName))
      const rootFileInfo = get(listRootFilesSelector)

      return requiredFiles
        .map((r) => {
          const existsAtRoot = rootFileInfo.find((fi) => {
            switch (fi.type) {
              case "UnZipped":
                return fi.file_name === r.filename
              case "Zipped":
                return fi.inner_file === r.filename
            }
          })

          if (existsAtRoot)
            return { ...r, status: "at_root" } satisfies RequiredFileInfo

          const metadata = archiveMetadata.find(
            ({ name }) => name === r.filename
          )
          let status: RequiredFileInfo["status"]
          if (r.exists) {
            const crc32 = parseInt(metadata?.crc32 || "0", 16)
            if (crc32 === r.crc32) {
              status = "ok"
            } else {
              status = "wrong"
            }
          } else {
            status = "downloadable"
          }

          if (!metadata) {
            status = "not_in_archive"
          }

          return { ...r, status }
        })
        .sort((a, b) => (a.status || "").localeCompare(b.status || ""))
    },
})

export const listRootFilesSelector = selector<RootFile[]>({
  key: "listRootFilesSelector",
  get: async () => {
    const rootFileInfo = await invokeListRootFiles()
    return rootFileInfo
  },
})
