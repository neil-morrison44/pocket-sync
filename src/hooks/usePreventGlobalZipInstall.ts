import { enableGlobalZipInstallAtom } from "../recoil/atoms"
import { useEffect } from "react"
import { useSetAtom } from "jotai"

export const usePreventGlobalZipInstallModal = () => {
  const setEnableGlobalZipInstall = useSetAtom(enableGlobalZipInstallAtom)

  useEffect(() => {
    setEnableGlobalZipInstall(false)
    return () => setEnableGlobalZipInstall(true)
  }, [setEnableGlobalZipInstall])
}
