import { useEffect, useRef } from "react"
import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { AllSavesSelector } from "../../recoil/saves/selectors"
import { PocketSyncConfigSelector } from "../../recoil/config/selectors"
import { invokeBackupSaves, invokeFileExists } from "../../utils/invokes"

export const AutoBackup = () => {
  const hasBackedUpRef = useRef<boolean>(false)
  const allSaves = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(AllSavesSelector)
  const { saves } = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PocketSyncConfigSelector
  )

  useEffect(() => {
    if (hasBackedUpRef.current) return
    hasBackedUpRef.current = true
    ;(async () => {
      for (const save of saves) {
        const exists = await invokeFileExists(save.backup_location)
        if (!exists) continue
        await invokeBackupSaves(
          allSaves,
          save.backup_location,
          save.backup_count
        )
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
