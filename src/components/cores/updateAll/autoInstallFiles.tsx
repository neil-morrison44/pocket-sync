import { useCallback, useEffect, useRef } from "react"
import { useRecoilValue } from "recoil"
import { RequiredFilesWithStatusSelectorFamily } from "../../../recoil/archive/selectors"
import { PocketSyncConfigSelector } from "../../../recoil/config/selectors"
import { useProgress } from "../../../hooks/useProgress"
import { turboDownloadsAtom } from "../../../recoil/settings/atoms"
import { RequiredFileInfo } from "../../../types"
import { invoke } from "@tauri-apps/api"
import { Progress } from "../../progress"

export const AutoInstallFiles = ({
  coreName,
  onFinish,
}: {
  coreName: string
  onFinish: () => void
}) => {
  const stageRef = useRef<"unstarted" | "started" | "finished">("unstarted")
  const requiredFiles = useRecoilValue(
    RequiredFilesWithStatusSelectorFamily(coreName)
  )

  const { archive_url } = useRecoilValue(PocketSyncConfigSelector)

  const { percent, lastMessage, remainingTime } = useProgress(() => {
    onFinish()
  })

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

  useEffect(() => {
    if (stageRef.current === "unstarted") {
      stageRef.current = "started"
      installRequiredFiles(
        requiredFiles.filter(
          ({ status }) =>
            status === "downloadable" ||
            status === "wrong" ||
            status === "at_root" ||
            status === "at_root_match"
        )
      )
    }
  }, [installRequiredFiles, requiredFiles])

  return (
    <div className="update-all__core-progress">
      <Progress
        percent={percent}
        message={lastMessage}
        remainingTime={remainingTime}
      />
    </div>
  )
}
