import { useCallback } from "react"
import { ask } from "@tauri-apps/api/dialog"
import { invokeUninstallCore } from "../utils/invokes"
import { useInvalidateFileSystem } from "./invalidation"
import { useTranslation } from "react-i18next"

export const useUninstallCore = () => {
  const invalidateFileSystem = useInvalidateFileSystem()
  const { t } = useTranslation("uninstall_core")

  return useCallback(
    async (coreName: string) => {
      const sure = await ask(t("confirm_text"), {
        title: t("confirm_title"),
        type: "warning",
      })

      if (!sure) return

      const success = await invokeUninstallCore(coreName)

      if (success) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        invalidateFileSystem()
      }
    },
    [invalidateFileSystem, t]
  )
}
