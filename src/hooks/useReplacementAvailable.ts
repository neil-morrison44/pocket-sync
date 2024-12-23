import { useMemo } from "react"
import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { coreInventoryAtom } from "../recoil/inventory/atoms"

export const useReplacementAvailable = (coreName: string) => {
  const coreInventory =
    useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(coreInventoryAtom)

  return useMemo<string | null>(() => {
    const inventoryCore = coreInventory.data.find(
      ({ identifier }) => identifier === coreName
    )
    return inventoryCore?.replaced_by || null
  }, [coreInventory.data, coreName])
}
