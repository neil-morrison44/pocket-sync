import { useRecoilValue } from "recoil"
import { CoreInventorySelector } from "../recoil/inventory/selectors"

export const useInventoryItem = (coreName: string) => {
  const coreInventory = useRecoilValue(CoreInventorySelector)
  const inventoryItem = coreInventory.data.find(
    ({ identifier }) => identifier === coreName
  )

  if (!inventoryItem) return null
  return inventoryItem
}
