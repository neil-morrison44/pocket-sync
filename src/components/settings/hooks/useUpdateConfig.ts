import { startTransition, useCallback } from "react"

import { pocketPathAtom } from "../../../recoil/atoms"
import { PocketSyncConfigSelector } from "../../../recoil/config/selectors"
import { PocketSyncConfig } from "../../../types"
import { invokeSaveFile } from "../../../utils/invokes"
import { Getter, Setter } from "jotai"
import { useAtomCallback } from "jotai/utils"

type updateConfigFn = <T extends keyof PocketSyncConfig>(
  key: T,
  value:
    | PocketSyncConfig[T]
    | ((current: PocketSyncConfig[T]) => PocketSyncConfig[T])
) => void

export const useUpdateConfig = (): updateConfigFn => {
  return useAtomCallback(
    useCallback(async (get, set, key, value) => {
      const currentConfig = await get(PocketSyncConfigSelector)
      const newValue =
        typeof value == "function" ? value(currentConfig[key]) : value
      const newConfig = {
        ...currentConfig,
        [key]: newValue,
      } as PocketSyncConfig

      startTransition(() => set(PocketSyncConfigSelector, newConfig))
    }, [])
  )
}
