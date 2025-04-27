import { useMemo } from "react"

import { coreInventoryAtom } from "../recoil/inventory/atoms"
import { CoreInfoSelectorFamily } from "../recoil/selectors"
import { useAtomValue } from "jotai"

export const useUpdateAvailable = (coreName: string) => {
  const coreInfo = useAtomValue(CoreInfoSelectorFamily(coreName))
  const coreInventory = useAtomValue(coreInventoryAtom)

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
