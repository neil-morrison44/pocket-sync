import { useEffect, useRef, useState } from "react"
import { useRecoilValue } from "recoil"
import { AllSavesSelector } from "../../recoil/saves/selectors"
import { PocketSyncConfigSelector } from "../../recoil/selectors"
import { invokeBackupSaves, invokeFileExists } from "../../utils/invokes"

export const AutoBackup = () => {
  const hasBackedUpRef = useRef<boolean>(false)
  const allSaves = useRecoilValue(AllSavesSelector)
  const { saves } = useRecoilValue(PocketSyncConfigSelector)

  useEffect(() => {
    if (hasBackedUpRef.current) return
    hasBackedUpRef.current = true
    ;(async () => {
      for (const save of saves) {
        const exists = await invokeFileExists(save.backup_location)
        if (!exists) return
        await invokeBackupSaves(
          allSaves,
          save.backup_location,
          save.backup_count
        )
      }
    })()
  }, [])

  return null
}
