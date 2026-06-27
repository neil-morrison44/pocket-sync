import { atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { listen } from "@tauri-apps/api/event"
import { getDefaultStore } from "jotai"
import { splitAsPath } from "../../utils/splitAsPath"
import { FSEvent } from "../../types"
import { sep } from "@tauri-apps/api/path"

export const fsWatchAtomFamily = atomFamily((path: string) => atom(Date.now()))

export const initGlobalFSEvents = async () => {
  const store = getDefaultStore()

  await listen<{ events: FSEvent[]; pocket_path: string }>(
    "pocket-fs-event",
    ({ payload }) => {
      const { events, pocket_path } = payload

      const changedPaths = events.flatMap((e) => e.paths)

      console.log(changedPaths)

      changedPaths.forEach((fullPath) => {
        const relativePath = fullPath
          .replace(`${pocket_path}${sep()}`, "")
          .replace(`${pocket_path}`, "")

        store.set(fsWatchAtomFamily(relativePath), Date.now())

        const parts = splitAsPath(relativePath)
        let currentPath = ""

        for (const part of parts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part
          store.set(fsWatchAtomFamily(currentPath), Date.now())
        }
      })
    }
  )
}
