import { useMemo } from "react"
import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { coreInventoryAtom } from "../recoil/inventory/atoms"

export const useReplacementAvailable = (coreName: string) => {
  const coreInventory =
    useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(coreInventoryAtom)

  return useMemo<string | null>(() => {
    const inventoryCore = coreInventory.cores.data.find(({ releases }) =>
      releases[0].updaters?.previous?.includes(coreName)
    )
    return inventoryCore?.id || null
  }, [coreInventory.cores.data, coreName])
}
