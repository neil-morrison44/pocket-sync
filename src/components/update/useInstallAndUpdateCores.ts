import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"
import { confirm } from "@tauri-apps/plugin-dialog"
import { PocketSyncConfigSelector } from "../../jotai/config/selectors"
import { turboDownloadsAtom } from "../../jotai/settings/atoms"
import { invokeInstallAndUpdateCores } from "../../utils/invokes"

/**
 * Starts the bulk install / update (the backend reports progress to
 * `UpdateModal`). `running` is true from the start until `finish()`, which
 * the modal's close calls.
 */
export const useInstallAndUpdateCores = () => {
  const { t } = useTranslation("update")
  const config = useAtomValue(PocketSyncConfigSelector)
  const turboDownloads = useAtomValue(turboDownloadsAtom)
  const [running, setRunning] = useState(false)

  const start = useCallback(
    async ({
      installList = [],
      updateList = [],
    }: {
      installList?: string[]
      updateList?: string[]
    }) => {
      if (config.archive_url === "" || config.archive_url === null) {
        const confirmNoArchiveUrl = await confirm(
          t("no_archive_url_warning.text"),
          { title: t("no_archive_url_warning.title"), kind: "warning" }
        )
        if (!confirmNoArchiveUrl) return
      }

      setRunning(true)
      await invokeInstallAndUpdateCores({
        installList,
        updateList,
        options: {
          include_alternate_files: !config.skipAlternateAssets,
          retain_platform_files: true,
          archive_url: config.archive_url ?? undefined,
          fast_downloads: turboDownloads.enabled,
        },
      })
    },
    [config, turboDownloads, t]
  )

  const finish = useCallback(() => setRunning(false), [])

  return { start, running, finish }
}
