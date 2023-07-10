import { useCallback } from "react"
import { useRecoilValue } from "recoil"
import { useInvalidateFileSystem } from "../../../hooks/invalidation"
import { pocketPathAtom } from "../../../recoil/atoms"
import { PlatformInfoSelectorFamily } from "../../../recoil/platforms/selectors"
import { PlatformId, PlatformInfoJSON } from "../../../types"
import { invokeSaveFile } from "../../../utils/invokes"

type InnerPlatform = PlatformInfoJSON["platform"]

export const useUpdatePlatformValue = (id: PlatformId) => {
  const platformInfo = useRecoilValue(PlatformInfoSelectorFamily(id))
  const pocketPath = useRecoilValue(pocketPathAtom)
  const invalidateFS = useInvalidateFileSystem()

  return useCallback(
    async <T extends keyof InnerPlatform>(key: T, value: InnerPlatform[T]) => {
      const newPlatform: PlatformInfoJSON = {
        ...platformInfo,
        platform: {
          ...platformInfo.platform,
          [key]: value,
        },
      }
      const encoder = new TextEncoder()
      await invokeSaveFile(
        `${pocketPath}/Platforms/${id}.json`,
        encoder.encode(JSON.stringify(newPlatform, null, 2))
      )

      setTimeout(() => invalidateFS(), 500)
    },
    [id, invalidateFS, platformInfo, pocketPath]
  )
}
