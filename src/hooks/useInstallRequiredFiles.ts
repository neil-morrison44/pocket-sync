import { useCallback } from "react"
import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { PocketSyncConfigSelector } from "../recoil/config/selectors"
import { DataSlotFile } from "../types"
import { useProgress } from "./useProgress"
import { turboDownloadsAtom } from "../recoil/settings/atoms"
import { invokeInstallArchiveFiles } from "../utils/invokes"

export const useInstallRequiredFiles = () => {
  const { archive_url } = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PocketSyncConfigSelector
  )

  const { percent, inProgress, message, remainingTime } = useProgress(
    "install_archive_files"
  )

  const turboDownloads =
    useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(turboDownloadsAtom)

  const installRequiredFiles = useCallback(
    async (files: DataSlotFile[], other_archive_url?: string) => {
      const archiveUrl = other_archive_url ?? archive_url
      if (!archiveUrl)
        throw new Error("Attempt to download without an `archive_url` set")

      const _response = await invokeInstallArchiveFiles(
        files,
        archiveUrl,
        turboDownloads.enabled
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
