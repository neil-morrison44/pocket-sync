import { useCallback } from "react"
import { emit } from "@tauri-apps/api/event"
import { githubTokenAtom } from "../recoil/settings/atoms"
import { useAtomValue } from "jotai"

export const useInstallCore = () => {
  const githubToken = useAtomValue(githubTokenAtom)

  const installCore = useCallback(
    async (coreName: string, zipUrl: string) => {
      emit("install-core", {
        core_name: coreName,
        zip_url: zipUrl,
        github_token: githubToken.value,
      })
    },
    [githubToken]
  )

  return { installCore }
}
