import { useEffect, useMemo, useRef, useState } from "react"
import { InstallZipEventPayload } from "../../zipInstall/types"
import { listen } from "@tauri-apps/api/event"
import { Progress } from "../../progress"

export const CoreInstallProgress = () => {
  const [installState, setInstallState] =
    useState<null | InstallZipEventPayload>(null)

  const installStageRef = useRef<
    "unstarted" | "started" | "confirmed" | "finished"
  >("unstarted")

  useEffect(() => {
    const unlisten = listen<InstallZipEventPayload>(
      "install-zip-event",
      ({ payload }) => setInstallState(payload)
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [setInstallState])

  const progress = useMemo(() => {
    if (installStageRef.current === "finished") return { value: 100, max: 100 }
    if (!installState) return { value: 0, max: 100 }
    if (installState.progress) return installState.progress

    return { value: 0, max: 100 }
  }, [installState])

  return (
    <div className="update-all__core-progress">
      <Progress percent={(progress.value / progress.max) * 100} />
    </div>
  )
}
