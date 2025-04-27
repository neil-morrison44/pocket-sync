import { startTransition, useCallback } from "react"

import { pocketPathAtom } from "../../../recoil/atoms"
import { PocketSyncConfigSelector } from "../../../recoil/config/selectors"
import { PocketSyncConfig } from "../../../types"
import { invokeSaveFile } from "../../../utils/invokes"
import { Getter, Setter } from "jotai"
import { useAtomCallback } from "jotai/utils"

export const useUpdateConfig = () => {
  return useAtomCallback(
    useCallback(
      async <T extends keyof PocketSyncConfig>(
        get: Getter,
        set: Setter,
        key: T,
        value:
          | PocketSyncConfig[T]
          | ((current: PocketSyncConfig[T]) => PocketSyncConfig[T])
      ) => {
        const currentConfig = await get(PocketSyncConfigSelector)
        const newValue =
          typeof value == "function" ? value(currentConfig[key]) : value
        const newConfig = {
          ...currentConfig,
          [key]: newValue,
        } as PocketSyncConfig

        startTransition(() => set(PocketSyncConfigSelector, newConfig))
      },
      []
    )
  )
}
