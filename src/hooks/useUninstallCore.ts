import { useCallback } from "react"
import { useSetRecoilState } from "recoil"
import { fileSystemInvalidationAtom } from "../recoil/atoms"
import { ask } from "@tauri-apps/api/dialog"
import { invokeUninstallCore } from "../utils/invokes"

export const useUninstallCore = () => {
  const updateFSInvalidationAtom = useSetRecoilState(fileSystemInvalidationAtom)

  return useCallback(async (coreName: string) => {
    const sure = await ask(
      "This will remove the core, but not any games, saves, library data, or platform information. Are you sure?",
      { title: "Uninstall Core", type: "warning" }
    )

    if (!sure) return

    const success = await invokeUninstallCore(coreName)

    if (success) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      updateFSInvalidationAtom(Date.now())
    }
  }, [])
}
