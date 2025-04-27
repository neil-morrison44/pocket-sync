import { PocketSyncConfigSelector } from "../recoil/config/selectors"
import { useMemo } from "react"
import { useAtomValue } from "jotai"

export const useHasArchiveLink = () => {
  const pocketSyncConfig = useAtomValue(PocketSyncConfigSelector)
  return useMemo(
    () =>
      pocketSyncConfig.archive_url !== null &&
      pocketSyncConfig.archive_url !== "",
    [pocketSyncConfig]
  )
}
