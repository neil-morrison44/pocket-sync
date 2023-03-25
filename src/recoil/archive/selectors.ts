import { selector, selectorFamily } from "recoil"
import { ArchiveFileMetadata, RequiredFileInfo } from "../../types"
import { RequiredFileInfoSelectorFamily } from "../selectors"
import { PocketSyncConfigSelector } from "../config/selectors"

export const archiveMetadataSelector = selector<ArchiveFileMetadata[]>({
  key: "archiveMetadataSelector",
  get: async ({ get }) => {
    const config = get(PocketSyncConfigSelector)
    if (!config.archive_url) return []
    const url = config.archive_url.replace("download", "metadata")
    const { files } = (await (await fetch(url)).json()) as {
      files: ArchiveFileMetadata[]
    }

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
            if (metadata?.sha1 === r.sha1) {
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
