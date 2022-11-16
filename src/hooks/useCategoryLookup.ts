import { useRecoilCallback } from "recoil"
import { CoreInventorySelector } from "../recoil/selectors"

export const useCategoryLookup = () => {
  // might change this to query the filesystem instead but that'll
  // probably take _a while_ to load
  return useRecoilCallback(({ snapshot }) => (coreName: string) => {
    const coreInventory = snapshot.getLoadable(CoreInventorySelector)

    if (coreInventory.state !== "hasValue") return "Unknown"
    const { data } = coreInventory.getValue()
    const inventoryItem = data.find(({ identifier }) => identifier === coreName)
    const aRelease = inventoryItem?.release || inventoryItem?.prerelease
    if (!aRelease) return "Unknown"

    return aRelease.platform.category ?? "Uncategorized"
  })
}
