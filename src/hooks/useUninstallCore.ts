import { useCallback } from "react"
import { ask } from "@tauri-apps/api/dialog"
import { invokeUninstallCore } from "../utils/invokes"
import { useInvalidateFileSystem } from "./invalidation"

export const useUninstallCore = () => {
  const invalidateFileSystem = useInvalidateFileSystem()

  return useCallback(async (coreName: string) => {
    const sure = await ask(
      "This will remove the core, but not any games, saves, library data, or platform information. Are you sure?",
      { title: "Uninstall Core", type: "warning" }
    )

    if (!sure) return

    const success = await invokeUninstallCore(coreName)

    if (success) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      invalidateFileSystem()
    }
  }, [])
}
