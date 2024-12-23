import { useCallback } from "react"
import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { pocketPathAtom } from "../../../recoil/atoms"
import { PlatformInfoSelectorFamily } from "../../../recoil/platforms/selectors"
import { PlatformId, PlatformInfoJSON } from "../../../types"
import { invokeSaveFile } from "../../../utils/invokes"

type InnerPlatform = PlatformInfoJSON["platform"]

export const useUpdatePlatformValue = (id: PlatformId) => {
  const platformInfo = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PlatformInfoSelectorFamily(id)
  )
  const pocketPath = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(pocketPathAtom)

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
    },
    [id, platformInfo, pocketPath]
  )
}
