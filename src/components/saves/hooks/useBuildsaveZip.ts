import { useCallback } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { fileSystemInvalidationAtom } from "../../../recoil/atoms"
import { AllSavesSelector } from "../../../recoil/selectors"
import { invokeBackupSaves } from "../../../utils/invokes"

export const useBuildSaveZip = () => {
  const allSaves = useRecoilValue(AllSavesSelector)
  const invalidateFS = useSetRecoilState(fileSystemInvalidationAtom)

  return useCallback(
    async (savePath: string, maxCount: number) => {
      await invokeBackupSaves(allSaves, savePath, maxCount)
      invalidateFS(Date.now())
    },
    [allSaves]
  )
}
