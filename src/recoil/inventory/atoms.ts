import { atom } from "recoil"
import { InventoryJSON } from "../../types"

export const coreInventoryAtom = atom<InventoryJSON>({
  key: "coreInventoryAtom",
  default: (async () => {
    const response = await fetch(
      "https://openfpga-cores-inventory.github.io/analogue-pocket/api/v2/cores.json"
    )
    return (await response.json()) as InventoryJSON
  })(),
})
