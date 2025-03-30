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
    const inventoryCore = coreInventory.cores.data.find(
      ({ id }) => id === coreName
    )

    if (!inventoryCore?.releases[0].core.metadata.version) return null

    const { version } = inventoryCore.releases[0].core.metadata
    const metadataVersion = coreInfo.core.metadata.version

    if (version !== metadataVersion) {
      if (version.includes(metadataVersion)) {
        return null
      }
      return version
    }

    return null
  }, [coreInfo.core.metadata.version, coreInventory.cores.data, coreName])
}
