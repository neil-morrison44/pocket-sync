import { useCallback } from "react"
import { useRecoilValue } from "recoil"
import { useInvalidateConfig } from "../../../hooks/invalidation"
import { pocketPathAtom } from "../../../recoil/atoms"
import { PocketSyncConfigSelector } from "../../../recoil/config/selectors"
import { PocketSyncConfig } from "../../../types"
import { invokeSaveFile } from "../../../utils/invokes"

export const useUpdateConfig = () => {
  const currentConfig = useRecoilValue(PocketSyncConfigSelector)
  const pocketPath = useRecoilValue(pocketPathAtom)
  const invalidateConfigSelector = useInvalidateConfig()

  return useCallback(
    async <T extends keyof PocketSyncConfig>(
      key: T,
      value:
        | PocketSyncConfig[T]
        | ((current: PocketSyncConfig[T]) => PocketSyncConfig[T])
    ) => {
      const newConfig = {
        ...currentConfig,
        [key]: typeof value == "function" ? value(currentConfig[key]) : value,
      } as PocketSyncConfig
      const encoder = new TextEncoder()
      await invokeSaveFile(
        `${pocketPath}/pocket-sync.json`,
        encoder.encode(JSON.stringify(newConfig, null, 2))
      )

      setTimeout(() => invalidateConfigSelector(), 500)
    },
    [currentConfig]
  )
}
