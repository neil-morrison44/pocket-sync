import { useSetRecoilState } from "recoil"
import { enableGlobalZipInstallAtom } from "../recoil/atoms"
import { useEffect } from "react"

export const usePreventGlobalZipInstallModal = () => {
  const setEnableGlobalZipInstall = useSetRecoilState(
    enableGlobalZipInstallAtom
  )

  useEffect(() => {
    setEnableGlobalZipInstall(false)
    return () => setEnableGlobalZipInstall(true)
  }, [setEnableGlobalZipInstall])
}
