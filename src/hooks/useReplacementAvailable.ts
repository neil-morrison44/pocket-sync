import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { coreInventoryAtom } from "../recoil/inventory/atoms"

export const useReplacementAvailable = (coreName: string) => {
  const coreInventory = useRecoilValue(coreInventoryAtom)

  return useMemo<string | null>(() => {
    const inventoryCore = coreInventory.data.find(
      ({ identifier }) => identifier === coreName
    )
    return inventoryCore?.replaced_by || null
  }, [coreInventory.data, coreName])
}
