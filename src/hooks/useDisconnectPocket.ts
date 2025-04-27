import { useCallback } from "react"
import { pocketPathAtom } from "../recoil/atoms"
import { useSetAtom } from "jotai"
import { configChangesAtom } from "../recoil/config/selectors"

export const useDisconnectPocket = () => {
  const setPocketPath = useSetAtom(pocketPathAtom)
  const setConfigChanges = useSetAtom(configChangesAtom)

  return useCallback(async () => {
    setPocketPath(null)
    setConfigChanges(null)
    await new Promise((resolve) => setTimeout(resolve, 50))
  }, [setPocketPath])
}
