import { atom } from "recoil"
import { InventoryJSON } from "../../types"

const INTERVAL_MINS = 10

const INVENTORY_API =
  "https://openfpga-cores-inventory.github.io/analogue-pocket/api/v2/cores.json"

export const coreInventoryAtom = atom<InventoryJSON>({
  key: "coreInventoryAtom",
  default: (async () => {
    const response = await fetch(INVENTORY_API)
    return (await response.json()) as InventoryJSON
  })(),
  effects: [
    ({ setSelf }) => {
      setInterval(async () => {
        const response = await fetch(INVENTORY_API)
        const newJson: InventoryJSON = await response.json()
        setSelf(newJson)
      }, INTERVAL_MINS * 60 * 1000)
    },
  ],
})
