import { atom } from "recoil"
import { InventoryJSON } from "../../types"

const INTERVAL_MINS = 10

const INVENTORY_API =
  "https://openfpga-cores-inventory.github.io/analogue-pocket/api/v2/cores.json"

export const coreInventoryAtom = atom<InventoryJSON>({
  key: "coreInventoryAtom",
  default: (async () => {
    const response = await fetch(INVENTORY_API + `?cache_bust=${Date.now()}`)
    return (await response.json()) as InventoryJSON
  })(),
  effects: [
    ({ onSet, setSelf }) => {
      onSet(async (_a, _b, isReset) => {
        // isReset should work here but it doesn't seem to
        // so instead do this for any outside set
        const response = await fetch(
          INVENTORY_API + `?cache_bust=${Date.now()}`
        )
        const newJson: InventoryJSON = await response.json()
        setSelf(newJson)
      })
    },
    ({ setSelf }) => {
      setInterval(async () => {
        const response = await fetch(
          INVENTORY_API + `?cache_bust=${Date.now()}`
        )
        const newJson: InventoryJSON = await response.json()
        setSelf(newJson)
      }, INTERVAL_MINS * 60 * 1000)
    },
  ],
})
