import { invoke } from "@tauri-apps/api"
import { useCallback } from "react"
import { useRecoilValue } from "recoil"
import { PocketSyncConfigSelector } from "../recoil/config/selectors"
import { RequiredFileInfo } from "../types"
import { useInvalidateFileSystem } from "./invalidation"
import { useProgress } from "./useProgress"
import { turboDownloadsAtom } from "../recoil/settings/atoms"

export const useInstallRequiredFiles = () => {
  const { archive_url } = useRecoilValue(PocketSyncConfigSelector)
  const invalidateFS = useInvalidateFileSystem()

  const { percent, inProgress, lastMessage, remainingTime } = useProgress(
    () => {
      invalidateFS()
    }
  )

  const turboDownloads = useRecoilValue(turboDownloadsAtom)

  const installRequiredFiles = useCallback(
    async (files: RequiredFileInfo[], other_archive_url?: string) => {
      const this_archive_url = other_archive_url ?? archive_url
      if (!this_archive_url)
        throw new Error("Attempt to download without an `archive_url` set")

      const _response = await invoke<boolean>("install_archive_files", {
        files,
        archiveUrl: this_archive_url,
        turbo: turboDownloads.enabled,
      })
    },
    [archive_url, turboDownloads.enabled]
  )

  return {
    installRequiredFiles,
    percent,
    inProgress,
    lastMessage,
    remainingTime,
  }
}
