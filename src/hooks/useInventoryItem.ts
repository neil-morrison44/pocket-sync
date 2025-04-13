import { coreInventoryAtom } from "../recoil/inventory/atoms"
import { useAtomValue } from "jotai"

export const useInventoryItem = (coreName: string) => {
  const coreInventory = useAtomValue(coreInventoryAtom)
  const inventoryItem = coreInventory.cores.data.find(
    ({ id }) => id === coreName
  )

  if (!inventoryItem) return null
  return inventoryItem
}
