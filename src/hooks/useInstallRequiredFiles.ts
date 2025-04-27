import { useCallback } from "react"
import { PocketSyncConfigSelector } from "../recoil/config/selectors"
import { DataSlotFile } from "../types"
import { useProgress } from "./useProgress"
import { turboDownloadsAtom } from "../recoil/settings/atoms"
import { invokeInstallArchiveFiles } from "../utils/invokes"
import { useAtomValue } from "jotai"

export const useInstallRequiredFiles = (jobId = "install_archive_files") => {
  const { archive_url } = useAtomValue(PocketSyncConfigSelector)
  const { percent, inProgress, message, remainingTime } = useProgress(jobId)
  const turboDownloads = useAtomValue(turboDownloadsAtom)

  const installRequiredFiles = useCallback(
    async (files: DataSlotFile[], other_archive_url?: string) => {
      const archiveUrl = other_archive_url ?? archive_url
      if (!archiveUrl)
        throw new Error("Attempt to download without an `archive_url` set")

      const _response = await invokeInstallArchiveFiles(
        files,
        archiveUrl,
        turboDownloads.enabled,
        jobId
      )
    },
    [archive_url, turboDownloads.enabled]
  )

  return {
    installRequiredFiles,
    percent,
    inProgress,
    message,
    remainingTime,
  }
}
