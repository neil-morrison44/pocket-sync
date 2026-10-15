import { atom } from "jotai"
import { atomFamily } from "jotai-family"
import { listen } from "@tauri-apps/api/event"
import { getDefaultStore } from "jotai"
import { splitAsPath } from "../../utils/splitAsPath"
import { FSEvent } from "../../types"
import { sep } from "@tauri-apps/api/path"

const fsWatchAtoms = atomFamily((path: string) => atom(Date.now()))

/**
 * Changes whenever something under `path` (relative to the SD card) changes.
 * Paths are normalised, so "/Fetch Example" and "Fetch Example/" watch the
 * same folder as the file events ("Fetch Example"); "/" is the card's root.
 */
export const fsWatchAtomFamily = (path: string) => {
  const trimmed = path.replace(/^[\\/]+|[\\/]+$/g, "")
  return fsWatchAtoms(trimmed === "" ? "/" : trimmed)
}

export const initGlobalFSEvents = async () => {
  const store = getDefaultStore()
  let isPaused = false
  const queuedChanges: Set<string> = new Set()

  const processChangedPaths = () => {
    queuedChanges.forEach((relativePath) => {
      store.set(fsWatchAtomFamily(relativePath), Date.now())
      const parts = splitAsPath(relativePath)
      let currentPath = ""

      // Files at the top of the SD card (e.g. a firmware .bin) change the
      // root listing, which is watched as "/"
      if (parts.length <= 1) store.set(fsWatchAtomFamily("/"), Date.now())

      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        store.set(fsWatchAtomFamily(currentPath), Date.now())
      }
    })

    queuedChanges.clear()
  }

  await listen<boolean>(
    "pocket-fs-pause",
    ({ payload }) => (isPaused = payload)
  )

  await listen<{ events: FSEvent[]; pocket_path: string }>(
    "pocket-fs-event",
    ({ payload }) => {
      const { events, pocket_path } = payload

      const changedPaths = events
        .flatMap((e) => e.paths)
        .map((p) =>
          p.replace(`${pocket_path}${sep()}`, "").replace(`${pocket_path}`, "")
        )

      changedPaths.forEach((p) => queuedChanges.add(p))
      if (!isPaused) processChangedPaths()
    }
  )
}
