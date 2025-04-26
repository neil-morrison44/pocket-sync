import { useCallback } from "react"

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
        _set: Setter,
        key: T,
        value:
          | PocketSyncConfig[T]
          | ((current: PocketSyncConfig[T]) => PocketSyncConfig[T])
      ) => {
        const currentConfig = await get(PocketSyncConfigSelector)
        const pocketPath = get(pocketPathAtom)
        const newValue =
          typeof value == "function" ? value(currentConfig[key]) : value
        const newConfig = {
          ...currentConfig,
          [key]: newValue,
        } as PocketSyncConfig

        if (newValue === undefined) {
          delete newConfig[key]
        }

        const encoder = new TextEncoder()
        const text = encoder.encode(JSON.stringify(newConfig, null, 2))
        await invokeSaveFile(`${pocketPath}/pocket-sync.json`, text)
      },
      []
    )
  )
}
