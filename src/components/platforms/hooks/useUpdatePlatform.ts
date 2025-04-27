import { useCallback } from "react"
import { pocketPathAtom } from "../../../recoil/atoms"
import { PlatformInfoSelectorFamily } from "../../../recoil/platforms/selectors"
import { PlatformId, PlatformInfoJSON } from "../../../types"
import { invokeSaveFile } from "../../../utils/invokes"
import { useAtomValue } from "jotai"

type InnerPlatform = PlatformInfoJSON["platform"]

export const useUpdatePlatformValue = (id: PlatformId) => {
  const platformInfo = useAtomValue(PlatformInfoSelectorFamily(id))
  const pocketPath = useAtomValue(pocketPathAtom)

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
