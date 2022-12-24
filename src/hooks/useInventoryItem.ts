import { useRecoilValue } from "recoil"
import { coreInventoryAtom } from "../recoil/inventory/atoms"

export const useInventoryItem = (coreName: string) => {
  const coreInventory = useRecoilValue(coreInventoryAtom)
  const inventoryItem = coreInventory.data.find(
    ({ identifier }) => identifier === coreName
  )

  if (!inventoryItem) return null
  return inventoryItem
}
