import { useCallback } from "react"

import { pocketPathAtom } from "../../../recoil/atoms"
import { PocketSyncConfigSelector } from "../../../recoil/config/selectors"
import { PocketSyncConfig } from "../../../types"
import { invokeSaveFile } from "../../../utils/invokes"
import { useAtomValue } from "jotai"

export const useUpdateConfig = () => {
  const currentConfig = useAtomValue(PocketSyncConfigSelector)
  const pocketPath = useAtomValue(pocketPathAtom)

  return useCallback(
    async <T extends keyof PocketSyncConfig>(
      key: T,
      value:
        | PocketSyncConfig[T]
        | ((current: PocketSyncConfig[T]) => PocketSyncConfig[T])
    ) => {
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
      await invokeSaveFile(
        `${pocketPath}/pocket-sync.json`,
        encoder.encode(JSON.stringify(newConfig, null, 2))
      )
    },
    [currentConfig, pocketPath]
  )
}
