import { invoke } from "@tauri-apps/api/tauri"
import { useCallback } from "react"
import { useSetRecoilState } from "recoil"
import { fileSystemInvalidationAtom } from "../recoil/atoms"
import { emit, listen } from "@tauri-apps/api/event"

// emits the `click` event with the object payload

export const useInstallCore = () => {
  const updateFSInvalidationAtom = useSetRecoilState(fileSystemInvalidationAtom)

  return useCallback(async (coreName: string, zipUrl: string) => {
    emit("install-core", {
      coreName,
      zipUrl,
    })

    const status = await invoke<string>("install_core", {
      coreName,
      zipUrl,
    })

    if (status === "200") updateFSInvalidationAtom(Date.now())
  }, [])
}
