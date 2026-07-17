import { useCallback, useMemo, useState } from "react"
import { PocketSyncConfigSelector } from "../jotai/config/selectors"
import { DataSlotFile } from "../types"
import { useProgress } from "./useProgress"
import { turboDownloadsAtom } from "../jotai/settings/atoms"
import { invokeInstallArchiveFiles } from "../utils/invokes"
import { useAtomValue } from "jotai"
import prettyBytes from "pretty-bytes"

export const useInstallRequiredFiles = (jobId = "install_archive_files") => {
  const { archive_url } = useAtomValue(PocketSyncConfigSelector)
  const { percent, inProgress, message, remainingTime, completed, total } =
    useProgress(jobId)
  const turboDownloads = useAtomValue(turboDownloadsAtom)
  const [startTime, setStartTime] = useState(0)

  const installRequiredFiles = useCallback(
    async (files: DataSlotFile[], other_archive_url?: string) => {
      const archiveUrl = other_archive_url ?? archive_url
      if (!archiveUrl)
        throw new Error("Attempt to download without an `archive_url` set")

      setStartTime(Date.now())
      const _response = await invokeInstallArchiveFiles(
        files,
        archiveUrl,
        turboDownloads.enabled,
        jobId
      )
    },
    [archive_url, turboDownloads.enabled]
  )

  const speed = useMemo(() => {
    if (completed === 0) return ""
    const now = Date.now()
    const timeDetla = now - startTime
    const seconds = timeDetla / 1000
    const bytesPerSecond = completed / seconds
    return prettyBytes(bytesPerSecond)
  }, [startTime, completed, total])

  return {
    installRequiredFiles,
    percent,
    inProgress,
    message,
    remainingTime,
    speed,
  }
}
