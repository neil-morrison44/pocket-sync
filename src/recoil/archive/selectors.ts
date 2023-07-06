import { selector, selectorFamily } from "recoil"
import { ArchiveFileMetadata, RequiredFileInfo } from "../../types"
import { PocketSyncConfigSelector } from "../config/selectors"
import {
  FileInfoSelectorFamily,
  RequiredFileInfoSelectorFamily,
} from "../requiredFiles/selectors"
import { archiveBumpAtom } from "./atoms"
import {
  invokeFetchJSONURL,
  invokeListFiles,
  invokeWalkDirListFiles,
} from "../../utils/invokes"
import { ResponseType, getClient } from "@tauri-apps/api/http"

export const ArchiveMetadataSelectorFamily = selectorFamily<
  ArchiveFileMetadata[],
  { archiveName: string }
>({
  key: "ArchiveMetadataSelectorFamily",
  get:
    ({ archiveName }) =>
    async ({ get }) => {
      get(archiveBumpAtom)
      const url = `https://archive.org/metadata/${archiveName}`

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
  { path: string }
>({
  key: "PathFileInfoSelectorFamily",
  get:
    ({ path }) =>
    async ({ get }) => {
      const fileList = await invokeWalkDirListFiles(path, [])

      const all = fileList.map((filename) =>
        get(FileInfoSelectorFamily({ path, filename }))
      )

      console.log({ all })

      return all
    },
})

export const archiveMetadataSelector = selector<ArchiveFileMetadata[]>({
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
    ({ get }) => {
      const archiveMetadata = get(archiveMetadataSelector)
      const requiredFiles = get(RequiredFileInfoSelectorFamily(coreName))

      return requiredFiles
        .map((r) => {
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
            status = "not-in-archive"
          }

          return { ...r, status }
        })
        .sort((a, b) => (a.status || "").localeCompare(b.status || ""))
    },
})
