import { selector, selectorFamily } from "recoil"
import { ArchiveFileMetadata, RequiredFileInfo } from "../../types"
import { PocketSyncConfigSelector } from "../config/selectors"
import { RequiredFileInfoSelectorFamily } from "../requiredFiles/selectors"
import { archiveBumpAtom } from "./atoms"
import { invokeFetchJSONURL } from "../../utils/invokes"

export const archiveMetadataSelector = selector<ArchiveFileMetadata[]>({
  key: "archiveMetadataSelector",
  get: async ({ get }) => {
    get(archiveBumpAtom)
    const config = get(PocketSyncConfigSelector)
    if (!config.archive_url) return []

    let url = config.archive_url.replace("download", "metadata")
    if (url.includes("updater.")) url = url + "/updater.php"

    const { files } = await invokeFetchJSONURL<{
      files: ArchiveFileMetadata[]
    }>(url)

    // const { files } = (await (await fetch(url)).json()) as {
    //   files: ArchiveFileMetadata[]
    // }
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
