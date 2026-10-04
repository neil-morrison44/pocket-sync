import { listen } from "@tauri-apps/api/event"
import { Activity, useEffect, useState } from "react"
import { Modal } from "../modal"
import { useTranslation } from "react-i18next"
import { NotInstalledCoreImage } from "./shared"

type UpdateModalProps = {
  onClose: () => void
}

export const UpdateModal = ({ onClose }: UpdateModalProps) => {
  const { t } = useTranslation("update")
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
  }>({ one: { core_name: null, index: 0, total: 0 } })
  const [currentEvent, setCurrentEvent] = useState<UpdateEvent | null>(null)

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
        <ol className="update__modal-status">
          {Object.entries(phaseStatuses).map(([phaseName, phaseStatus]) => {
            return (
              <li
                key={phaseName}
                className={`update__modal-status-line update__modal-status-line--${phaseStatus}`}
              >
                {t(
                  `phase_status.${phaseName}.${phaseStatus}`,
                  phaseStatusArgs[phaseName]
                )}
              </li>
            )
          })}
        </ol>

        <div className="update__core-flythrough">
          <Activity
            mode={phaseStatuses.one === "in_progress" ? "visible" : "hidden"}
          >
            {Object.entries(installedCores).map(
              ([coreName, { progress, height, zOffset }]) => (
                <div
                  key={coreName}
                  className="update__core-flythrough-item"
                  style={{
                    transform: `translate(${progress * 100}cqw, ${height}cqh) translateZ(-${zOffset * 10}px)`,
                  }}
                >
                  <NotInstalledCoreImage coreName={coreName} />
                </div>
              )
            )}
          </Activity>

          <PhaseTwoLoading />
          {/*</Activity>*/}
        </div>

        <div className="update__modal-buttons">
          <button onClick={onClose}>{"close"}</button>
        </div>
      </div>
      <pre>{JSON.stringify(currentEvent, null, 2)}</pre>
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
      console.log({ payload })
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
          className="update__core-flythrough-item"
          style={{
            transform: `translateX(${5 + x / 1.25}cqw) translateY(${5 + y / 1.25}cqh) translateZ(-${(1 - progress) * 1000}px)`,
          }}
        >
          <NotInstalledCoreImage coreName={coreName} />
        </div>
      ))}
      <pre>{JSON.stringify(lastEvent, null, 2)}</pre>
    </>
  )
}

export type CoreDownloadType = "Update" | "Install"

export type PhaseOneErrorType = "GithubRateLimit" | "Other"

export type PhaseThreeErrorType = "Network" | "FileSystem" | "Other"

export type UpdateEvent =
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
  | { type: "PhaseOneErrorEvent"; error: PhaseOneErrorType }
  | { type: "PhaseTwoStartedEvent" }
  | {
      type: "PhaseTwoProgressEvent"
      processed_cores: number
      total_cores: number
    }
  | { type: "PhaseThreeStartedEvent" }
  | {
      type: "PhaseThreeDownloadProgressEvent"
      core_name: string
      file_name: string
      download_progress: number
      file_index: number
      file_index_for_core: number
      total_core_count: number
      total_core_count_for_core: number
      elapsed_time: number
      elapsed_bytes: number
    }
  | { type: "PhaseThreeErrorEvent"; error: PhaseThreeErrorType }
  | {
      type: "Finish"
      updated_cores: string[]
      installed_cores: string[]
      installed_files_per_core: Record<string, string[]>
      total_time: number
    }
