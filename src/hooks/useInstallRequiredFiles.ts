import { invoke } from "@tauri-apps/api"
import { listen } from "@tauri-apps/api/event"
import { useCallback, useEffect, useState } from "react"
import { useRecoilValue } from "recoil"
import { PocketSyncConfigSelector } from "../recoil/selectors"
import { RequiredFileInfo } from "../types"
import { useInvalidateFileSystem } from "./invalidation"

export const useInstallRequiredFiles = () => {
  const { archive_url } = useRecoilValue(PocketSyncConfigSelector)
  const invalidateFS = useInvalidateFileSystem()

  const [progress, setProgress] = useState<{
    value: number
    max: number
  } | null>(null)

  useEffect(() => {
    const unlisten = listen<{ max: number; value: number }>(
      "file-progress",
      ({ payload }) => {
        setProgress(payload)
        if (payload.max === payload.value) {
          invalidateFS()
          setProgress(null)
        }
      }
    )

    return () => {
      unlisten.then((l) => l())
    }
  }, [])

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

  return { installRequiredFiles, progress }
}
