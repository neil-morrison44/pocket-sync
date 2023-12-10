import { useRecoilValue } from "recoil"
import { useInstallCore } from "../../../hooks/useInstallCore"
import { DownloadURLSelectorFamily } from "../../../recoil/inventory/selectors"
import { useEffect, useMemo, useRef, useState } from "react"
import { InstallZipEventPayload } from "../../zipInstall/types"
import { emit, listen } from "@tauri-apps/api/event"
import { message } from "@tauri-apps/api/dialog"
import { Progress } from "../../progress"

export const AutoInstallCore = ({
  coreName,
  platformFiles,
  onFinish,
}: {
  coreName: string
  platformFiles: boolean
  onFinish: () => void
}) => {
  const { installCore } = useInstallCore()
  const download_url = useRecoilValue(DownloadURLSelectorFamily(coreName))
  const [installState, setInstallState] =
    useState<null | InstallZipEventPayload>(null)

  const installStageRef = useRef<
    "unstarted" | "started" | "confirmed" | "finished"
  >("unstarted")

  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const unlisten = listen<InstallZipEventPayload>(
      "install-zip-event",
      ({ payload }) => setInstallState(payload)
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [setInstallState])

  useEffect(() => {
    const unlisten = listen<{ error?: string }>(
      "install-zip-finished",
      ({ payload }) => {
        installStageRef.current = "finished"
        if (payload.error)
          message(payload.error, { title: "Error", type: "error" })

        setInstallState(null)
        if (startTimeRef.current) {
          // Show on screen for at least 4 seconds
          const timeDelta = Date.now() - startTimeRef.current
          setTimeout(onFinish, Math.max(0, 4e3 - timeDelta))
        } else {
          onFinish()
        }
      }
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [setInstallState, onFinish])

  useEffect(() => {
    if (!download_url || installStageRef.current !== "unstarted") return
    installCore(coreName, download_url)
    installStageRef.current = "started"
    startTimeRef.current = Date.now()

    return () => {}
  }, [download_url, coreName, installCore])

  useEffect(() => {
    if (installState && installStageRef.current === "started") {
      installStageRef.current = "confirmed"
      const { files } = installState

      const paths = (files || [])
        .filter(({ path }) => {
          const isRootTxt = !path.includes("/") && path.endsWith(".txt")
          if (!platformFiles)
            return !path.startsWith("Platforms/") && !isRootTxt
          return !isRootTxt
        })
        .map(({ path }) => path)

      emit("install-confirmation", {
        type: "InstallConfirmation",
        paths,
        handle_moved_files: true,
        allow: true,
      })
    }
  }, [installState, platformFiles])

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
