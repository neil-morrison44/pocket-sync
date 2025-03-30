import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { coreInventoryAtom } from "../recoil/inventory/atoms"

export const useInventoryItem = (coreName: string) => {
  const coreInventory =
    useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(coreInventoryAtom)
  const inventoryItem = coreInventory.cores.data.find(
    ({ id }) => id === coreName
  )

  if (!inventoryItem) return null
  return inventoryItem
}
