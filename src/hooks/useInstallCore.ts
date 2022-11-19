import { useCallback, useEffect, useState } from "react"
import { useSetRecoilState } from "recoil"
import { fileSystemInvalidationAtom } from "../recoil/atoms"
import { emit, listen } from "@tauri-apps/api/event"
import { InstallDetails } from "../types"

// emits the `click` event with the object payload

export const useInstallCore = () => {
  const updateFSInvalidationAtom = useSetRecoilState(fileSystemInvalidationAtom)
  const [installDetails, setInstallDetails] = useState<InstallDetails | null>(
    null
  )

  useEffect(() => {
    const unlisten = listen<InstallDetails>(
      "install-details",
      ({ payload }) => {
        setInstallDetails(payload)
      }
    )

    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  useEffect(() => {
    const unlisten = listen<InstallDetails>("core-installed", ({ payload }) => {
      setInstallDetails(null)
      updateFSInvalidationAtom(Date.now())
    })

    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  const installCore = useCallback(async (coreName: string, zipUrl: string) => {
    emit("install-core", {
      core_name: coreName,
      zip_url: zipUrl,
    })
  }, [])

  return { installCore, installDetails }
}
