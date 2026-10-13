import { useEffect, useRef } from "react"
import {
  AllSavesSelector,
  backupsRefreshAtom,
} from "../../jotai/saves/selectors"
import { PocketSyncConfigSelector } from "../../jotai/config/selectors"
import { invokeBackupSaves, invokeFileExists } from "../../utils/invokes"
import { useAtomValue, useSetAtom } from "jotai"

export const AutoBackup = () => {
  const hasBackedUpRef = useRef<boolean>(false)
  const allSaves = useAtomValue(AllSavesSelector)
  const { saves } = useAtomValue(PocketSyncConfigSelector)
  const refreshBackups = useSetAtom(backupsRefreshAtom)

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
      refreshBackups((count) => count + 1)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
