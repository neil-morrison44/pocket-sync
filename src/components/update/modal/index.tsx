import { emit, listen } from "@tauri-apps/api/event"
import { Activity, Suspense, useCallback, useEffect, useState } from "react"
import { Modal } from "../../modal"
import { useTranslation } from "react-i18next"
import {
  formatDownloadTime,
  InstalledCoreImage,
  NotInstalledCoreImage,
} from "../shared"
import prettyBytes from "pretty-bytes"
import { confirm } from "@tauri-apps/plugin-dialog"
import { Canvas } from "@react-three/fiber"
import { UpdateThreeScene } from "./threeScene"
import { UpdateFinishedReport } from "./finishedReport"

type UpdateModalProps = {
  onClose: () => void
}

export const UpdateModal = ({ onClose }: UpdateModalProps) => {
  const { t } = useTranslation("update")
  const [phaseOneErrors, setPhaseOneErrors] = useState<string[]>([])
  const [phaseThreeErrors, setPhaseThreeErrors] = useState<string[]>([])

  const [phaseStatuses, setPhaseStatuses] = useState<
    Record<
      "zero" | "one" | "two" | "three",
      "unstarted" | "in_progress" | "finished"
    >
  >({
    zero: "unstarted",
    one: "unstarted",
    two: "unstarted",
    three: "unstarted",
  })

  const [phaseStatusArgs, setPhaseStatusArgs] = useState<{
    one: {
      core_name: null | string
      index: number
      total: number
    }
    three: {
      file_name: string
      core_name: string
      file_bytes: string
      remaining_bytes: string
      index: number
      total: number
    }
  }>({
    one: { core_name: null, index: 0, total: 0 },
    three: {
      file_name: "",
      core_name: "",
      file_bytes: "0B",
      remaining_bytes: "0B",
      index: 0,
      total: 0,
    },
  })
  const [currentEvent, setCurrentEvent] = useState<UpdateEvent | null>(null)
  const [phaseThreeCurrentEvent, setPhaseThreeCurrentEvent] =
    useState<PhaseThreeArgs | null>(null)

  const [installedCores, setInstalledCores] = useState<
    Record<string, { progress: number; height: number; zOffset: number }>
  >({})

  useEffect(() => {
    const unlisten = listen<UpdateEvent>(
      "install_and_update_cores::update_event",
      ({ payload }) => {
        switch (payload.type) {
          case "PhaseZeroStartedEvent": {
            setPhaseStatuses((p) => ({ ...p, zero: "in_progress" }))
            break
          }
          case "PhaseOneStartedEvent": {
            setPhaseStatuses((p) => ({ ...p, zero: "finished" }))
            break
          }
          case "PhaseOneCoreDownloadProgressEvent": {
            setPhaseStatuses((p) => ({ ...p, one: "in_progress" }))
            setPhaseStatusArgs((p) => ({
              ...p,
              one: {
                core_name: payload.core_name,
                index: payload.core_index + 1,
                total: payload.total_core_count,
              },
            }))
            setInstalledCores((p) => {
              return {
                ...p,
                [payload.core_name]: {
                  ...(p[payload.core_name] ?? {
                    height: Math.random() * 90,
                    zOffset: Math.random(),
                  }),
                  progress: payload.download_progress,
                },
              }
            })
            break
          }
          case "PhaseOneErrorEvent": {
            setPhaseOneErrors((errs) => [...errs, payload.error])
            break
          }
          case "PhaseTwoStartedEvent": {
            setPhaseStatuses((p) => ({
              ...p,
              one: "finished",
              two: "in_progress",
            }))
            break
          }
          case "PhaseThreeStartedEvent": {
            setPhaseStatuses((p) => ({ ...p, two: "finished" }))
            break
          }
          case "PhaseThreeDownloadProgressEvent": {
            setPhaseStatuses((p) => ({ ...p, three: "in_progress" }))

            setPhaseStatusArgs((p) => ({
              ...p,
              three: {
                file_name: payload.file_name,
                core_name: payload.core_name,
                file_bytes: prettyBytes(payload.file_bytes),
                index: payload.file_index + 1,
                total: payload.total_file_count,
                remaining_bytes: prettyBytes(payload.remaining_bytes),
              },
            }))

            setPhaseThreeCurrentEvent(payload)
            break
          }
          case "PhaseThreeErrorEvent": {
            setPhaseThreeErrors((errs) => [...errs, payload.error])
            break
          }
          case "Finish": {
            setPhaseStatuses((p) => ({
              zero: "finished",
              one: "finished",
              two: "finished",
              three: "finished",
            }))
          }
        }

        setCurrentEvent(payload)
      }
    )

    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  return (
    <Modal>
      <div className="update__modal">
        <div className="update__modal-status">
          <ol>
            {Object.entries(phaseStatuses).map(([phaseName, phaseStatus]) => {
              return (
                <li
                  key={phaseName}
                  className={`update__modal-status-line update__modal-status-line--${phaseStatus}`}
                >
                  {t(
                    `phase_status.${phaseName}.${phaseStatus}`,
                    // @ts-expect-error I know this works
                    phaseStatusArgs[phaseName]
                  )}
                  {phaseName === "one" && phaseOneErrors.length > 0 && (
                    <Errors errors={phaseOneErrors} />
                  )}
                  {phaseName === "three" && phaseThreeErrors.length > 0 && (
                    <Errors errors={phaseThreeErrors} />
                  )}
                </li>
              )
            })}
          </ol>
          {phaseStatuses.three === "in_progress" && phaseThreeCurrentEvent && (
            <PhaseThreeControls coreName={phaseThreeCurrentEvent.core_name} />
          )}
          {phaseStatuses.three === "finished" && (
            <button onClick={onClose}>{t("buttons.close")}</button>
          )}
        </div>

        <Activity
          mode={phaseStatuses.two === "in_progress" ? "visible" : "hidden"}
        >
          <div className="update__core-item-grid">
            <PhaseTwoLoading />
          </div>
        </Activity>

        <Activity
          mode={phaseStatuses.one === "in_progress" ? "visible" : "hidden"}
        >
          <div className="update__core-flythrough">
            {Object.entries(installedCores).map(
              ([coreName, { progress, height, zOffset }]) => (
                <div
                  key={coreName}
                  className="update__core-flythrough-item"
                  style={{
                    opacity: Math.max(0, Math.min(1, (1 - progress) * 20)),
                    transform: `translate(${progress * 80}cqw, ${height * (1 - progress) + 50 * progress}cqh) translateZ(-${(1 - progress) * zOffset * 20}px)`,
                  }}
                >
                  <NotInstalledCoreImage coreName={coreName} />
                </div>
              )
            )}
          </div>
        </Activity>
        <Activity mode={currentEvent?.type === "Finish" ? "visible" : "hidden"}>
          <div className="update__core-finish-report">
            {currentEvent?.type === "Finish" && (
              <UpdateFinishedReport {...currentEvent} />
            )}
          </div>
        </Activity>
        <Activity
          mode={
            phaseStatuses.one === "in_progress" ||
            phaseStatuses.three === "in_progress"
              ? "visible"
              : "hidden"
          }
        >
          <Canvas
            className="update__core-3d-scene"
            camera={{ fov: 10, position: [0, 0, 50] }}
          >
            <UpdateThreeScene
              progress={
                phaseStatuses.three === "in_progress" && phaseThreeCurrentEvent
                  ? phaseThreeCurrentEvent.download_progress
                  : undefined
              }
              coreName={
                phaseStatuses.three === "in_progress" && phaseThreeCurrentEvent
                  ? phaseThreeCurrentEvent.core_name
                  : undefined
              }
              loadingModel={
                phaseStatuses.three === "in_progress" && phaseThreeCurrentEvent
                  ? (phaseThreeCurrentEvent.file_name.endsWith(".rom") &&
                      "Arcade") ||
                    ((phaseThreeCurrentEvent.file_name.endsWith(".iso") ||
                      phaseThreeCurrentEvent.file_name
                        .toLowerCase()
                        .endsWith(".pak") ||
                      phaseThreeCurrentEvent.file_name
                        .toLowerCase()
                        .endsWith(".wad")) &&
                      "Disk") ||
                    "Chip"
                  : undefined
              }
            />
          </Canvas>
        </Activity>
      </div>
      <div className="update__modal-progress">
        {phaseStatuses.one === "in_progress" && (
          <PhaseOneLoading
            coreName={Object.entries(installedCores ?? {}).at(-1)?.[0]}
            progress={
              Object.entries(installedCores ?? {}).at(-1)?.[1].progress ?? 0
            }
          />
        )}
        {phaseStatuses.three === "in_progress" && phaseThreeCurrentEvent && (
          <PhaseThreeLoading {...phaseThreeCurrentEvent} />
        )}
      </div>
      {/*<pre>{JSON.stringify(currentEvent, null, 2)}</pre>*/}
    </Modal>
  )
}

const PhaseTwoLoading = () => {
  const [coreStats, setCoreStats] = useState<
    Record<string, { x: number; y: number; progress: number }>
  >({})
  const [lastEvent, setLastEvent] = useState<any | null>(null)
  useEffect(() => {
    const unlisten = listen<{
      context: string
      progress: number
      finished: number
    }>("progress-event::required_files_for_core", ({ payload }) => {
      setLastEvent(payload)
      setCoreStats((cs) => ({
        ...cs,
        [payload.context]: {
          x: cs[payload.context]?.x ?? Math.random() * 100,
          y: cs[payload.context]?.y ?? Math.random() * 100,
          progress: payload.finished ? 1 : payload.progress,
        },
      }))
    })

    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  return (
    <>
      {Object.entries(coreStats).map(([coreName, { x, y, progress }]) => (
        <div
          key={coreName}
          className="update__core-item-grid-item"
          style={{
            opacity: progress,
          }}
        >
          <Suspense fallback={<NotInstalledCoreImage coreName={coreName} />}>
            <InstalledCoreImage coreName={coreName} />
          </Suspense>
        </div>
      ))}
    </>
  )
}

const PhaseThreeControls = ({ coreName }: { coreName: String }) => {
  const { t } = useTranslation("update")
  const [hasConfirmedSkip, setHasConfirmedSkip] = useState(false)
  const skipAllForCore = useCallback(async () => {
    if (!hasConfirmedSkip) {
      const allow = confirm(t("buttons.skip_core_warning.text"), {
        title: t("buttons.skip_core_warning.title"),
        kind: "warning",
      })
      if (!allow) return
    }
    setHasConfirmedSkip(true)
    await emit("install_and_update_cores::skip_event", {
      type: "Core",
      core_name: coreName,
    })
  }, [coreName, hasConfirmedSkip])

  const skipFile = useCallback(async () => {
    if (!hasConfirmedSkip) {
      const allow = confirm(t("buttons.skip_file_warning.text"), {
        title: t("buttons.skip_file_warning.title"),
        kind: "warning",
      })
      if (!allow) return
    }
    setHasConfirmedSkip(true)
    await emit("install_and_update_cores::skip_event", {
      type: "File",
    })
  }, [coreName, hasConfirmedSkip])

  return (
    <div className="update__controls">
      <button onClick={skipFile}>{t("buttons.skip_file")}</button>
      <button onClick={skipAllForCore}>{t("buttons.skip_core")}</button>
    </div>
  )
}

type PhaseOneLoadingProps = {
  coreName?: string
  progress: number
}

const PhaseOneLoading = ({ coreName, progress }: PhaseOneLoadingProps) => {
  const { t } = useTranslation("update")

  return (
    <>
      <div></div>
      <div>
        <label>
          {t("progress.one", {
            progress,
            core_name: coreName,
          })}
          <progress
            className="update__modal-progress-bar"
            value={progress * 100}
            max="100"
          />
        </label>
      </div>
      <div></div>
    </>
  )
}

type PhaseThreeLoadingProps = {} & PhaseThreeArgs

const PhaseThreeLoading = ({ ...props }: PhaseThreeLoadingProps) => {
  const {
    file_name,
    elapsed_time,
    downloaded_bytes,
    remaining_bytes,
    download_progress,
    file_bytes,
  } = props

  const { t } = useTranslation("update")
  const totalBytes =
    downloaded_bytes -
    file_bytes * download_progress +
    remaining_bytes +
    file_bytes

  const speedBps =
    elapsed_time / 1000 > 0 ? downloaded_bytes / (elapsed_time / 1000) : 0
  const etaSeconds = speedBps > 0 ? remaining_bytes / speedBps : 0
  const totalProgress = downloaded_bytes / totalBytes

  return (
    <>
      <div></div>
      <div>
        <label>
          {t("progress.three.file", {
            progress: download_progress,
            file_name,
          })}
          <progress
            className="update__modal-progress-bar"
            value={download_progress * 100}
            max="100"
          />
        </label>
        <label>
          {t("progress.three.total", {
            progress: totalProgress,
            eta: formatDownloadTime(etaSeconds),
          })}
          <progress
            className="update__modal-progress-bar"
            value={totalProgress * 100}
            max="100"
          />
        </label>
      </div>

      <div>
        <div>{speedBps > 0 ? `${prettyBytes(speedBps)}/s` : "Starting..."}</div>
        {prettyBytes(downloaded_bytes)} / {prettyBytes(totalBytes)}
      </div>
    </>
  )
}

const Errors = ({ errors }: { errors: string[] }) => {
  const allErrorsText = Array.from(new Set(errors)).join(", ")

  return (
    <div className="update__modal-errors">
      <div className="update__modal-errors-count">{errors.length}</div>

      {allErrorsText}
    </div>
  )
}

export type CoreDownloadType = "Update" | "Install"

type PhaseThreeArgs = {
  core_name: string
  file_name: string
  file_bytes: number
  download_progress: number
  file_index: number
  file_index_for_core: number
  total_file_count: number
  total_file_count_for_core: number
  elapsed_time: number
  downloaded_bytes: number
  remaining_bytes: number
}

type UpdateEvent =
  | { type: "PhaseZeroStartedEvent" }
  | { type: "PhaseOneStartedEvent" }
  | {
      type: "PhaseOneCoreDownloadProgressEvent"
      core_name: string
      download_progress: number
      core_index: number
      total_core_count: number
      download_type: CoreDownloadType
    }
  | { type: "PhaseOneErrorEvent"; error: string }
  | { type: "PhaseTwoStartedEvent" }
  | {
      type: "PhaseTwoProgressEvent"
      processed_cores: number
      total_cores: number
    }
  | { type: "PhaseThreeStartedEvent" }
  | ({
      type: "PhaseThreeDownloadProgressEvent"
    } & PhaseThreeArgs)
  | { type: "PhaseThreeErrorEvent"; error: string }
  | {
      type: "Finish"
      updated_cores: string[]
      installed_cores: string[]
      downloaded_files_per_core: Record<string, string[]>
      total_time: number
    }
