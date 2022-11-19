import { useCallback } from "react"
import { emit } from "@tauri-apps/api/event"

export const useInstallCore = () => {
  const installCore = useCallback(async (coreName: string, zipUrl: string) => {
    emit("install-core", {
      core_name: coreName,
      zip_url: zipUrl,
    })
  }, [])

  return { installCore }
}
