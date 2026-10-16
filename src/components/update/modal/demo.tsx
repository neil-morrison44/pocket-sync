import { useEffect, useMemo } from "react"
import { useAtomValue } from "jotai"

import { coreInventoryAtom } from "../../../jotai/inventory/atoms"
import { coresListSelector } from "../../../jotai/selectors"
import { UpdateEvent } from "../shared"
import { UpdateModal } from "."
import {
  createDemoEvents,
  REQUIRED_FILES_EVENT,
  UPDATE_EVENT,
  UpdateEventsContext,
} from "./events"

/** Where the demo stops, so each phase can be looked at as long as needed. */
export type UpdateDemoStop =
  | "cores"
  | "required_files"
  | "downloads"
  | "finished"

type UpdateModalDemoProps = {
  stopAt: UpdateDemoStop
  onClose: () => void
}

const STEP_MS = 120

/**
 * Development only (Settings → Developer): the update modal driven by a
 * scripted update instead of the backend. It uses the card's installed
 * cores (and a few from the inventory as "installed"), includes errors, and
 * holds at `stopAt`. Nothing is downloaded or changed.
 */
export const UpdateModalDemo = ({ stopAt, onClose }: UpdateModalDemoProps) => {
  const installed = useAtomValue(coresListSelector)
  const inventory = useAtomValue(coreInventoryAtom)
  const events = useMemo(createDemoEvents, [])

  useEffect(() => {
    const timers: number[] = []
    const updated = installed.slice(0, 3)
    const added = inventory.cores.data
      .map(({ id }) => id)
      .filter((id) => !installed.includes(id))
      .slice(0, 2)
    const cores = [...updated, ...added]
    const files = cores.flatMap((core, coreIndex) =>
      Array.from({ length: 2 }, (_, index) => ({
        core,
        name: `Assets/${core.split(".")[1]?.toLowerCase() ?? "demo"}/common/demo_file_${coreIndex + 1}_${index + 1}.rom`,
        bytes: (coreIndex + 1) * 3_500_000,
      }))
    )
    const totalBytes = files.reduce((sum, { bytes }) => sum + bytes, 0)

    const script: { event: UpdateEvent | null; extra?: () => void }[] = []
    const push = (event: UpdateEvent | null, extra?: () => void) =>
      script.push({ event, extra })

    push({ type: "PhaseZeroStartedEvent" })
    push(null)
    push({ type: "PhaseOneStartedEvent" })
    cores.forEach((core, index) => {
      for (let step = 0; step <= 10; step++) {
        push({
          type: "PhaseOneCoreDownloadProgressEvent",
          core_name: core,
          download_progress: step / 10,
          core_index: index,
          total_core_count: cores.length,
          download_type: updated.includes(core) ? "Update" : "Install",
        })
      }
    })
    push({
      type: "PhaseOneErrorEvent",
      error: "Demo: couldn't download a core (pretend network error)",
    })
    if (stopAt === "cores") {
      runScript()
      return stop
    }

    push({ type: "PhaseTwoStartedEvent" })
    cores.forEach((core) => {
      for (let step = 0; step <= 5; step++) {
        push(null, () =>
          events.emit(REQUIRED_FILES_EVENT, {
            context: core,
            progress: step / 5,
            finished: step === 5 ? 1 : 0,
          })
        )
      }
    })
    if (stopAt === "required_files") {
      runScript()
      return stop
    }

    push({ type: "PhaseThreeStartedEvent" })
    let downloaded = 0
    files.forEach((file, fileIndex) => {
      for (let step = 0; step <= 10; step++) {
        const progress = step / 10
        push({
          type: "PhaseThreeDownloadProgressEvent",
          core_name: file.core,
          file_name: file.name,
          file_bytes: file.bytes,
          download_progress: progress,
          file_index: fileIndex,
          file_index_for_core: fileIndex % 2,
          total_file_count: files.length,
          total_file_count_for_core: 2,
          elapsed_time: (script.length + 1) * STEP_MS,
          downloaded_bytes: downloaded + file.bytes * progress,
          remaining_bytes: totalBytes - downloaded - file.bytes * progress,
        })
      }
      downloaded += file.bytes
    })
    push({
      type: "PhaseThreeErrorEvent",
      error: "Demo: a required file wasn't in the archive",
    })
    if (stopAt === "downloads") {
      runScript()
      return stop
    }

    push({
      type: "Finish",
      updated_cores: updated,
      installed_cores: added,
      downloaded_files_per_core: Object.fromEntries(
        cores.map((core) => [
          core,
          files.filter((f) => f.core === core).map((f) => f.name),
        ])
      ),
      total_time: script.length * STEP_MS,
    })
    runScript()
    return stop

    // Plays the script one step at a time; stays on the last state
    function runScript() {
      script.forEach(({ event, extra }, index) => {
        timers.push(
          window.setTimeout(() => {
            if (event) events.emit(UPDATE_EVENT, event)
            extra?.()
          }, index * STEP_MS)
        )
      })
    }
    function stop() {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [events, installed, inventory, stopAt])

  return (
    <UpdateEventsContext value={events.listen}>
      <UpdateModal onClose={onClose} dismissible demo />
    </UpdateEventsContext>
  )
}
