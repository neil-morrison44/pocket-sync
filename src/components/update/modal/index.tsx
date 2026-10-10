import { emit, listen } from "@tauri-apps/api/event"
import { Activity, Suspense, useCallback, useEffect, useState } from "react"
import { Modal } from "../../modal"
import { useTranslation } from "react-i18next"
import {
  formatDownloadTime,
  InstalledCoreImage,
  NotInstalledCoreImage,
  PhaseThreeArgs,
} from "../shared"
import prettyBytes from "pretty-bytes"
import { confirm } from "@tauri-apps/plugin-dialog"
import { Canvas } from "@react-three/fiber"
import { UpdateThreeScene } from "./threeScene"
import { UpdateFinishedReport } from "./finishedReport"
import { useUpdateEventManager } from "./hooks"
import { useAtomValue } from "jotai"
import { PocketSyncConfigSelector } from "../../../jotai/config/selectors"
import { Link } from "../../link"

type UpdateModalProps = {
  onClose: () => void
}

export const UpdateModal = ({ onClose }: UpdateModalProps) => {
  const { t } = useTranslation("update")
  const updateState = useUpdateEventManager()

  return (
    <Modal>
      <div className="update__modal">
        <div className="update__modal-status">
          <ol>
            {Object.entries(updateState.phases).map(
              ([phaseName, phaseStatus]) => {
                return (
                  <li
                    key={phaseName}
                    className={`update__modal-status-line update__modal-status-line--${phaseStatus}`}
                  >
                    {t(
                      `phase_status.${phaseName}.${phaseStatus}`,
                      updateState.phaseArgs[phaseName as "one" | "three"]
                    )}
                    {phaseName === "one" &&
                      updateState.errors.one.length > 0 && (
                        <Errors errors={updateState.errors.one} />
                      )}
                    {phaseName === "three" &&
                      updateState.errors.three.length > 0 && (
                        <Errors errors={updateState.errors.three} />
                      )}
                  </li>
                )
              }
            )}
          </ol>
          {updateState.phases.three === "in_progress" &&
            updateState.phaseThreeCurrentEvent && (
              <PhaseThreeControls
                coreName={updateState.phaseThreeCurrentEvent.core_name}
              />
            )}
          {updateState.phases.three === "finished" && (
            <button onClick={onClose}>{t("buttons.close")}</button>
          )}
        </div>

        <Activity
          mode={updateState.phases.two === "in_progress" ? "visible" : "hidden"}
        >
          <div className="update__core-item-grid">
            <PhaseTwoLoading />
          </div>
        </Activity>

        <Activity
          mode={updateState.phases.one === "in_progress" ? "visible" : "hidden"}
        >
          <div className="update__core-flythrough">
            {Object.entries(updateState.installedCores).map(
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
        <Activity
          mode={
            updateState.currentEvent?.type === "Finish" ? "visible" : "hidden"
          }
        >
          <div className="update__core-finish-report">
            {updateState.currentEvent?.type === "Finish" && (
              <UpdateFinishedReport {...updateState.currentEvent} />
            )}
          </div>
        </Activity>
        <Activity
          mode={
            updateState.phases.one === "in_progress" ||
            updateState.phases.three === "in_progress"
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
                updateState.phases.three === "in_progress" &&
                updateState.currentEvent?.type ===
                  "PhaseThreeDownloadProgressEvent"
                  ? updateState.currentEvent.download_progress
                  : undefined
              }
              coreName={
                updateState.phases.three === "in_progress" &&
                updateState.currentEvent?.type ===
                  "PhaseThreeDownloadProgressEvent"
                  ? updateState.currentEvent.core_name
                  : undefined
              }
              loadingModel={
                updateState.phases.three === "in_progress" &&
                updateState.currentEvent?.type ===
                  "PhaseThreeDownloadProgressEvent"
                  ? (updateState.currentEvent.file_name.endsWith(".rom") &&
                      "Arcade") ||
                    ((updateState.currentEvent.file_name.endsWith(".iso") ||
                      updateState.currentEvent.file_name
                        .toLowerCase()
                        .endsWith(".pak") ||
                      updateState.currentEvent.file_name
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
        {updateState.phases.one === "in_progress" && (
          <PhaseOneLoading
            coreName={
              Object.entries(updateState.installedCores ?? {}).at(-1)?.[0]
            }
            progress={
              Object.entries(updateState.installedCores ?? {}).at(-1)?.[1]
                .progress ?? 0
            }
          />
        )}
        {updateState.currentEvent?.type ===
          "PhaseThreeDownloadProgressEvent" && (
          <PhaseThreeLoading {...updateState.currentEvent} />
        )}
      </div>
    </Modal>
  )
}

const PhaseTwoLoading = () => {
  const [coreStats, setCoreStats] = useState<
    Record<string, { x: number; y: number; progress: number }>
  >({})

  useEffect(() => {
    const unlisten = listen<{
      context: string
      progress: number
      finished: number
    }>("progress-event::required_files_for_core", ({ payload }) => {
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
  const config = useAtomValue(PocketSyncConfigSelector)
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
      <div>
        {config.archive_url?.includes("archive.org") && (
          <Link href="https://archive.org/donate/">
            {t("donate_archive_org")}
          </Link>
        )}
      </div>
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
        <div>{speedBps > 0 ? `${prettyBytes(speedBps)}/s` : "0B/s"}</div>
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
