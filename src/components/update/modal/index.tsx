import { emit } from "@tauri-apps/api/event"
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
import { NoToneMapping } from "three"
import { UpdateThreeScene } from "./threeScene"
import { UpdateFinishedReport } from "./finishedReport"
import { useUpdateEventManager } from "./hooks"
import { useAtomValue } from "jotai"
import { PocketSyncConfigSelector } from "../../../jotai/config/selectors"
import { Link } from "../../link"
import Button from "../../ui/Button"
import Icon from "../../ui/Icon"
import ProgressBar from "../../ui/ProgressBar"
import Spinner from "../../ui/Spinner"
import { REQUIRED_FILES_EVENT, useUpdateListen } from "./events"
// The core images' styles are shared with the rest of `update`
import "../index.css"
import "./index.css"

type UpdateModalProps = {
  onClose: () => void
  /**
   * Can be closed before it's finished; for the demo (Settings →
   * Developer), which may stop at any phase.
   */
  dismissible?: boolean
  /** Skipping only happens in a real update; the demo ignores it. */
  demo?: boolean
}

/**
 * Progress of a bulk install / update: the four phases as steps on the
 * left, the matching animation beside them, and the progress bars (and
 * skip buttons) below. Ends with a report of what changed.
 */
export const UpdateModal = ({
  onClose,
  dismissible = false,
  demo = false,
}: UpdateModalProps) => {
  const { t } = useTranslation("update")
  const updateState = useUpdateEventManager()
  const finished = updateState.phases.three === "finished"

  return (
    <Modal
      className="update-modal"
      title={t("modal_title")}
      onClose={finished || dismissible ? onClose : undefined}
    >
      <div className="update__modal">
        <ol className="update-modal__phases">
          {Object.entries(updateState.phases).map(
            ([phaseName, phaseStatus]) => (
              <li
                key={phaseName}
                className={`update-modal__phase update-modal__phase--${phaseStatus}`}
              >
                <span className="update-modal__phase-icon">
                  {phaseStatus === "in_progress" ? (
                    <Spinner size={16} />
                  ) : (
                    <Icon
                      icon={phaseStatus === "finished" ? "check" : "circle"}
                    />
                  )}
                </span>
                <span className="update-modal__phase-text">
                  {t(
                    `phase_status.${phaseName}.${phaseStatus}`,
                    updateState.phaseArgs[phaseName as "one" | "three"]
                  )}
                </span>
                {phaseName === "one" && updateState.errors.one.length > 0 && (
                  <Errors errors={updateState.errors.one} />
                )}
                {phaseName === "three" &&
                  updateState.errors.three.length > 0 && (
                    <Errors errors={updateState.errors.three} />
                  )}
              </li>
            )
          )}
        </ol>

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
            // Like the home screen's Pocket: the default tone mapping made
            // the black body nearly pure black
            onCreated={(state) => (state.gl.toneMapping = NoToneMapping)}
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
      <div className="update-modal__footer">
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
          <PhaseThreeLoading {...updateState.currentEvent} demo={demo} />
        )}
        {finished && (
          <div className="modal__actions">
            <Button theme="primary" onClick={onClose}>
              {t("buttons.close")}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

const PhaseTwoLoading = () => {
  const [coreStats, setCoreStats] = useState<
    Record<string, { x: number; y: number; progress: number }>
  >({})

  const listen = useUpdateListen()

  useEffect(() => {
    return listen<{
      context: string
      progress: number
      finished: number
    }>(REQUIRED_FILES_EVENT, (payload) => {
      setCoreStats((cs) => ({
        ...cs,
        [payload.context]: {
          x: cs[payload.context]?.x ?? Math.random() * 100,
          y: cs[payload.context]?.y ?? Math.random() * 100,
          progress: payload.finished ? 1 : payload.progress,
        },
      }))
    })
  }, [listen])

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

const PhaseThreeControls = ({
  coreName,
  demo,
}: {
  coreName: string
  demo: boolean
}) => {
  const { t } = useTranslation("update")
  const [hasConfirmedSkip, setHasConfirmedSkip] = useState(false)
  const skipAllForCore = useCallback(async () => {
    if (!hasConfirmedSkip) {
      const allow = await confirm(t("buttons.skip_core_warning.text"), {
        title: t("buttons.skip_core_warning.title"),
        kind: "warning",
      })
      if (!allow) return
    }
    setHasConfirmedSkip(true)
    if (demo) return
    await emit("install_and_update_cores::skip_event", {
      type: "Core",
      core_name: coreName,
    })
  }, [coreName, hasConfirmedSkip, demo, t])

  const skipFile = useCallback(async () => {
    if (!hasConfirmedSkip) {
      const allow = await confirm(t("buttons.skip_file_warning.text"), {
        title: t("buttons.skip_file_warning.title"),
        kind: "warning",
      })
      if (!allow) return
    }
    setHasConfirmedSkip(true)
    if (demo) return
    await emit("install_and_update_cores::skip_event", {
      type: "File",
    })
  }, [hasConfirmedSkip, demo, t])

  return (
    <div className="update-modal__skip">
      <Button theme="tertiary" onClick={skipFile}>
        {t("buttons.skip_file")}
      </Button>
      <Button theme="tertiary" onClick={skipAllForCore}>
        {t("buttons.skip_core")}
      </Button>
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
    <ProgressBar
      value={progress * 100}
      label={t("progress.one", { progress, core_name: coreName })}
    />
  )
}

type PhaseThreeLoadingProps = { demo: boolean } & PhaseThreeArgs

/** This file's and all files' progress, speed, size; skip buttons. */
const PhaseThreeLoading = ({ demo, ...props }: PhaseThreeLoadingProps) => {
  const config = useAtomValue(PocketSyncConfigSelector)
  const {
    core_name,
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
      <div className="update-modal__bars">
        <ProgressBar
          value={download_progress * 100}
          label={t("progress.three.file", {
            progress: download_progress,
            file_name,
          })}
        />
        <ProgressBar
          value={totalProgress * 100}
          label={t("progress.three.total", {
            progress: totalProgress,
            eta: formatDownloadTime(etaSeconds),
          })}
        />
      </div>
      <div className="update-modal__meta">
        <span>
          {`${speedBps > 0 ? `${prettyBytes(speedBps)}/s` : "0 B/s"} · ${prettyBytes(downloaded_bytes)} / ${prettyBytes(totalBytes)}`}
        </span>
        {config.archive_url?.includes("archive.org") && (
          <Link href="https://archive.org/donate/">
            {t("donate_archive_org")}
          </Link>
        )}
        <PhaseThreeControls coreName={core_name} demo={demo} />
      </div>
    </>
  )
}

/** A phase's errors, folded: the count, then each different one. */
const Errors = ({ errors }: { errors: string[] }) => {
  const { t } = useTranslation("update")
  const unique = Array.from(new Set(errors))
  return (
    <details className="update-modal__errors">
      <summary>
        <Icon icon="warning-diamond" />
        {t("errors", { count: errors.length })}
      </summary>
      <ul>
        {unique.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </details>
  )
}
