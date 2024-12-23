import { useCallback } from "react"
import { emit } from "@tauri-apps/api/event"
import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { githubTokenAtom } from "../recoil/settings/atoms"

export const useInstallCore = () => {
  const githubToken =
    useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(githubTokenAtom)

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
