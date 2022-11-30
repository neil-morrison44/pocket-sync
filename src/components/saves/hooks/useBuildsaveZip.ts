import { useCallback, useState } from "react"
import { useRecoilValue } from "recoil"
import { useInvalidateFileSystem } from "../../../hooks/invalidation"
import { AllSavesSelector } from "../../../recoil/saves/selectors"
import { invokeBackupSaves } from "../../../utils/invokes"

export const useBuildSaveZip = () => {
  const allSaves = useRecoilValue(AllSavesSelector)
  const invalidateFS = useInvalidateFileSystem()
  const [backupInProgress, setBackupInProgress] = useState(false)

  const backup = useCallback(
    async (savePath: string, maxCount: number) => {
      setBackupInProgress(true)
      await invokeBackupSaves(allSaves, savePath, maxCount)
      invalidateFS()
      setBackupInProgress(false)
    },
    [allSaves]
  )

  return { backup, backupInProgress }
}
