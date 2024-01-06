import { useCallback } from "react"
import { useInvalidateConfig, useInvalidateSaveFiles } from "./invalidation"
import { useSetRecoilState } from "recoil"
import { pocketPathAtom } from "../recoil/atoms"

export const useDisconnectPocket = () => {
  const invalidateConfig = useInvalidateConfig()
  const invalidateSaves = useInvalidateSaveFiles()
  const setPocketPath = useSetRecoilState(pocketPathAtom)

  return useCallback(async () => {
    setPocketPath(null)
    await new Promise((resolve) => setTimeout(resolve, 50))

    invalidateConfig()
    invalidateSaves()
  }, [invalidateConfig, invalidateSaves, setPocketPath])
}
