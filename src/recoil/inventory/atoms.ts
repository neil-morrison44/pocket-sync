import { atom } from "recoil"
import { InventoryJSON, InventoryPlatformsJSON } from "../../types"
import { info } from "@tauri-apps/plugin-log"

const INTERVAL_MINS = 2.5

const INVENTORY_API =
  "https://openfpga-cores-inventory.github.io/analogue-pocket/api/v3/cores.json"

const INVENTORY_PLATFORMS_API =
  "https://openfpga-cores-inventory.github.io/analogue-pocket/api/v3/platforms.json"

const getInventoryInfo = async () => {
  const [coresResponse, platformsResponse] = await Promise.all([
    fetch(INVENTORY_API + `?cache_bust=${Date.now()}`),
    fetch(INVENTORY_PLATFORMS_API + `?cache_bust=${Date.now()}`),
  ])

  const [cores, platforms] = (await Promise.all([
    coresResponse.json(),
    platformsResponse.json(),
  ])) as [InventoryJSON, InventoryPlatformsJSON]

  return { cores, platforms }
}

export const coreInventoryAtom = atom<{
  cores: InventoryJSON
  platforms: InventoryPlatformsJSON
}>({
  key: "coreInventoryAtom",
  default: (async () => {
    return await getInventoryInfo()
  })(),
  effects: [
    ({ onSet, setSelf }) => {
      onSet(async (_a, _b, _isReset) => {
        // isReset should work here but it doesn't seem to
        // so instead do this for any outside set
        setSelf(await getInventoryInfo())
      })
    },
    ({ setSelf }) => {
      const interval = setInterval(async () => {
        info("Fetching Inventory")
        setSelf(await getInventoryInfo())
      }, INTERVAL_MINS * 60 * 1000)

      return () => window.clearInterval(interval)
    },
  ],
})
