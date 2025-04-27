import { useEffect, useRef } from "react"
import { AllSavesSelector } from "../../recoil/saves/selectors"
import { PocketSyncConfigSelector } from "../../recoil/config/selectors"
import { invokeBackupSaves, invokeFileExists } from "../../utils/invokes"
import { useAtomValue } from "jotai"

export const AutoBackup = () => {
  const hasBackedUpRef = useRef<boolean>(false)
  console.log("AutoBackup")
  const allSaves = useAtomValue(AllSavesSelector)
  const { saves } = useAtomValue(PocketSyncConfigSelector)

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
