import { useEffect, useRef } from "react"
import { check } from "@tauri-apps/plugin-updater"
import { relaunch } from "@tauri-apps/plugin-process"
import { ask } from "@tauri-apps/plugin-dialog"
import { info } from "@tauri-apps/plugin-log"

const UPDATE_CHECK_INTERVAL_MINS = 15

export const AutoUpdate = () => {
  const declinedVersionRef = useRef<null | string>(null)

  useEffect(() => {
    const updateLoop = async (abort: AbortSignal) => {
      while (!abort.aborted) {
        info("Checking for update...")
        const update = await check()

        if (
          update?.available &&
          update.version !== declinedVersionRef.current
        ) {
          if (abort.aborted) break
          info(`Update to ${update.version} available! Date: ${update.date}`)

          const answer = await ask(`${update.body}`, {
            title: `Pocket Sync\nUpdate Available v${update.version}`,
            kind: "info",
          })

          if (answer) {
            await update.downloadAndInstall()
            await relaunch()
            return null
          } else {
            declinedVersionRef.current = update.version
          }
        }

        if (abort.aborted) break
        await new Promise((resolve) =>
          window.setTimeout(resolve, UPDATE_CHECK_INTERVAL_MINS * 60e3)
        )
      }
    }

    const abortController = new AbortController()
    updateLoop(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [])

  return null
}
