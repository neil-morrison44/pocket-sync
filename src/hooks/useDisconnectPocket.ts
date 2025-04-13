import { useCallback } from "react"
import { pocketPathAtom } from "../recoil/atoms"
import { useSetAtom } from "jotai"

export const useDisconnectPocket = () => {
  const setPocketPath = useSetAtom(pocketPathAtom)

  return useCallback(async () => {
    setPocketPath(null)
    await new Promise((resolve) => setTimeout(resolve, 50))
  }, [setPocketPath])
}
