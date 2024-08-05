import { useRecoilCallback } from "recoil"
import { turboDownloadsAtom } from "../../../../recoil/settings/atoms"
import { useInstallCore } from "../../../../hooks/useInstallCore"
import { DownloadURLSelectorFamily } from "../../../../recoil/inventory/selectors"
import { emit, listen } from "@tauri-apps/api/event"
import { InstallZipEventPayload } from "../../../zipInstall/types"
import { PocketSyncConfigSelector } from "../../../../recoil/config/selectors"
import { useState } from "react"
import { RequiredFileInfoSelectorFamily } from "../../../../recoil/requiredFiles/selectors"
import { invoke } from "@tauri-apps/api/core"

type UpdateInfo = {
  coreName: string
  update: boolean
  requiredFiles: boolean
  platformFiles: boolean
}

type UpdateStage = {
  coreName: string
  step: "core" | "filecheck" | "files"
}

export const useProcessUpdates = () => {
  const { installCore } = useInstallCore()
  const [stage, setStage] = useState<UpdateStage | null>(null)

  const [abortController] = useState(() => new AbortController())

  const processUpdates = useRecoilCallback(
    ({ snapshot }) =>
      async (updates: UpdateInfo[]) => {
        snapshot.retain()
        const turbo = await snapshot.getPromise(turboDownloadsAtom)
        const { archive_url: archiveUrl } = await snapshot.getPromise(
          PocketSyncConfigSelector
        )

        for (const update of updates) {
          if (abortController.signal.aborted) break
          const { coreName, platformFiles, requiredFiles } = update

          setStage({ coreName, step: "core" })

          const downloadUrl = await snapshot.getPromise(
            DownloadURLSelectorFamily(coreName)
          )
          if (!downloadUrl) continue
          installCore(coreName, downloadUrl)

          await new Promise((resolve) => {
            const unlisten = listen<InstallZipEventPayload>(
              "install-zip-event",
              ({ payload }) => {
                const { files, progress } = payload

                if (progress === null) {
                  const paths = (files || [])
                    .filter(({ path }) => {
                      const isRootTxt =
                        !path.includes("/") && path.endsWith(".txt")
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

                  resolve(true)
                  unlisten.then((l) => l())
                }
              }
            )
          })

          await new Promise((resolve) => {
            const unlisten = listen<{ error?: string }>(
              "install-zip-finished",
              () => {
                resolve(true)
                unlisten.then((l) => l())
              }
            )
          })

          if (requiredFiles && archiveUrl) {
            if (abortController.signal.aborted) break
            setStage({ coreName, step: "filecheck" })
            const requiredFiles = await snapshot.getPromise(
              RequiredFileInfoSelectorFamily(coreName)
            )
            setStage({ coreName, step: "files" })

            const files = requiredFiles.filter(
              ({ status }) =>
                status.type !== "Exists" && status.type !== "NotFound"
            )

            if (files.length === 0) continue

            const _response = await invoke<boolean>("install_archive_files", {
              files,
              archiveUrl,
              turbo: turbo.enabled,
            })
          }
        }

        setStage(null)
      },
    []
  )

  return { processUpdates, stage, abortController }
}
