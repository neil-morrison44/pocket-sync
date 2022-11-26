import { useCallback, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { fileSystemInvalidationAtom } from "../../../recoil/atoms"
import { AllSavesSelector } from "../../../recoil/saves/selectors"
import { invokeBackupSaves } from "../../../utils/invokes"

export const useBuildSaveZip = () => {
  const allSaves = useRecoilValue(AllSavesSelector)
  const invalidateFS = useSetRecoilState(fileSystemInvalidationAtom)
  const [backupInProgress, setBackupInProgress] = useState(false)

  const backup = useCallback(
    async (savePath: string, maxCount: number) => {
      setBackupInProgress(true)
      await invokeBackupSaves(allSaves, savePath, maxCount)
      invalidateFS(Date.now())
      setBackupInProgress(false)
    },
    [allSaves]
  )

  return { backup, backupInProgress }
}
