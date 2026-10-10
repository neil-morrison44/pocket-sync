import { atom } from "jotai"
import { atomFamily } from "jotai-family"
import { listen } from "@tauri-apps/api/event"
import { getDefaultStore } from "jotai"
import { splitAsPath } from "../../utils/splitAsPath"
import { FSEvent } from "../../types"
import { sep } from "@tauri-apps/api/path"

export const fsWatchAtomFamily = atomFamily((path: string) => atom(Date.now()))

export const initGlobalFSEvents = async () => {
  const store = getDefaultStore()
  let isPaused = false
  const queuedChanges: Set<string> = new Set()

  const processChangedPaths = () => {
    queuedChanges.forEach((relativePath) => {
      store.set(fsWatchAtomFamily(relativePath), Date.now())
      const parts = splitAsPath(relativePath)
      let currentPath = ""

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
