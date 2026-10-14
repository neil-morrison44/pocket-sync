import { useMemo } from "react"

import { coreInventoryAtom } from "../jotai/inventory/atoms"
import { CoreInfoSelectorFamily } from "../jotai/selectors"
import { useAtomValue } from "jotai"
import {
  demoUpdateCoreNamesSelector,
  demoUpdateVersion,
} from "../jotai/cores/selectors"

export const useUpdateAvailable = (coreName: string) => {
  const coreInfo = useAtomValue(CoreInfoSelectorFamily(coreName))
  const coreInventory = useAtomValue(coreInventoryAtom)
  const demoCores = useAtomValue(demoUpdateCoreNamesSelector)

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

    // Dev demo flag: preview the update UI on an up-to-date core
    if (demoCores.includes(coreName)) return demoUpdateVersion(metadataVersion)

    return null
  }, [
    coreInfo.core.metadata.version,
    coreInventory.cores.data,
    coreName,
    demoCores,
  ])
}
