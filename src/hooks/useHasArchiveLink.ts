import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { PocketSyncConfigSelector } from "../recoil/config/selectors"
import { useMemo } from "react"

export const useHasArchiveLink = () => {
  const pocketSyncConfig = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PocketSyncConfigSelector
  )
  return useMemo(
    () =>
      pocketSyncConfig.archive_url !== null &&
      pocketSyncConfig.archive_url !== "",
    [pocketSyncConfig]
  )
}
