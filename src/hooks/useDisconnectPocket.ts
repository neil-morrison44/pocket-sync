import { useCallback } from "react"
import { pocketPathAtom } from "../jotai/atoms"
import { useSetAtom } from "jotai"
import { configChangesAtom } from "../jotai/config/selectors"

export const useDisconnectPocket = () => {
  const setPocketPath = useSetAtom(pocketPathAtom)
  const setConfigChanges = useSetAtom(configChangesAtom)

  return useCallback(async () => {
    setPocketPath(null)
    setConfigChanges(null)
    await new Promise((resolve) => setTimeout(resolve, 50))
  }, [setPocketPath])
}
