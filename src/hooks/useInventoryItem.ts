import { coreInventoryAtom } from "../recoil/inventory/atoms"
import { useAtomValue } from "jotai"
import { useSmoothedAtomValue } from "../utils/jotai"

export const useInventoryItem = (coreName: string) => {
  const coreInventory = useSmoothedAtomValue(coreInventoryAtom)
  const inventoryItem = coreInventory.cores.data.find(
    ({ id }) => id === coreName
  )

  if (!inventoryItem) return null
  return inventoryItem
}
