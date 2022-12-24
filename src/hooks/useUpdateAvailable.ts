import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { coreInventoryAtom } from "../recoil/inventory/atoms"
import { CoreInfoSelectorFamily } from "../recoil/selectors"

export const useUpdateAvailable = (coreName: string) => {
  const coreInfo = useRecoilValue(CoreInfoSelectorFamily(coreName))
  const coreInventory = useRecoilValue(coreInventoryAtom)

  return useMemo<string | null>(() => {
    const inventoryCore = coreInventory.data.find(
      ({ identifier }) => identifier === coreName
    )

    if (!inventoryCore?.release) return null

    const { version } = inventoryCore.release
    const metadataVersion = coreInfo.core.metadata.version

    if (version !== metadataVersion) {
      if (version.includes(metadataVersion)) {
        return null
      }
      return inventoryCore.release.version
    }

    return null
  }, [coreInfo.core.metadata.version, coreInventory])
}
