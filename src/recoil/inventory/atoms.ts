import { atom } from "jotai"
import { InventoryJSON, InventoryPlatformsJSON } from "../../types"
import { info } from "@tauri-apps/plugin-log"
import { atomWithRefresh } from "jotai/utils"
import { withAtomEffect } from "jotai-effect"

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

const coreInventoryAtomBase = atomWithRefresh(
  async (_get) => await getInventoryInfo()
)

export const coreInventoryAtom = withAtomEffect(
  coreInventoryAtomBase,
  (_get, set) => {
    const interval = setInterval(async () => {
      set(coreInventoryAtomBase)
    }, INTERVAL_MINS * 60 * 1000)

    return () => clearInterval(interval)
  }
)
