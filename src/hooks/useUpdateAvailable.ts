import { useMemo } from "react"
import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { coreInventoryAtom } from "../recoil/inventory/atoms"
import { CoreInfoSelectorFamily } from "../recoil/selectors"

export const useUpdateAvailable = (coreName: string) => {
  const coreInfo = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    CoreInfoSelectorFamily(coreName)
  )
  const coreInventory =
    useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(coreInventoryAtom)

  return useMemo<string | null>(() => {
    const inventoryCore = coreInventory.data.find(
      ({ identifier }) => identifier === coreName
    )

    if (!inventoryCore?.version) return null

    const { version } = inventoryCore
    const metadataVersion = coreInfo.core.metadata.version

    if (version !== metadataVersion) {
      if (version.includes(metadataVersion)) {
        return null
      }
      return version
    }

    return null
  }, [coreInfo.core.metadata.version, coreInventory.data, coreName])
}
