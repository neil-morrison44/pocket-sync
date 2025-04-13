import { useMemo } from "react"
import { coreInventoryAtom } from "../recoil/inventory/atoms"
import { useAtomValue } from "jotai"

export const useReplacementAvailable = (coreName: string) => {
  const coreInventory = useAtomValue(coreInventoryAtom)

  return useMemo<string | null>(() => {
    const inventoryCore = coreInventory.cores.data.find(({ releases }) =>
      releases[0].updaters?.previous?.includes(coreName)
    )
    return inventoryCore?.id || null
  }, [coreInventory.cores.data, coreName])
}
