import { useRecoilValue } from "recoil"
import { PocketSyncConfigSelector } from "../recoil/config/selectors"
import { useMemo } from "react"

export const useHasArchiveLink = () => {
  const pocketSyncConfig = useRecoilValue(PocketSyncConfigSelector)
  return useMemo(
    () =>
      pocketSyncConfig.archive_url !== null &&
      pocketSyncConfig.archive_url !== "",
    [pocketSyncConfig]
  )
}
