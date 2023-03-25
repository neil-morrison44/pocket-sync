import { invoke } from "@tauri-apps/api"
import { useCallback, useState } from "react"
import { useRecoilValue } from "recoil"
import { PocketSyncConfigSelector } from "../recoil/config/selectors"
import { RequiredFileInfo } from "../types"
import { useInvalidateFileSystem } from "./invalidation"
import { useProgress } from "./useProgress"

export const useInstallRequiredFiles = () => {
  const { archive_url } = useRecoilValue(PocketSyncConfigSelector)
  const invalidateFS = useInvalidateFileSystem()

  const { percent, inProgress, lastMessage, remainingTime } = useProgress(
    () => {
      invalidateFS()
    }
  )

  const installRequiredFiles = useCallback(
    async (files: RequiredFileInfo[]) => {
      if (!archive_url)
        throw new Error("Attempt to download without an `archive_url` set")

      const response = await invoke<boolean>("install_archive_files", {
        files,
        archiveUrl: archive_url,
      })
    },
    [archive_url]
  )

  return {
    installRequiredFiles,
    percent,
    inProgress,
    lastMessage,
    remainingTime,
  }
}
