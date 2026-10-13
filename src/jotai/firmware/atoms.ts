import { invokeGetFirmwareVersionsList } from "../../utils/invokes"
import { FirmwareListItem } from "../../types"
import { atomWithRefresh } from "jotai/utils"
import { withAtomEffect } from "jotai-effect"
import { startTransition } from "react"

const INTERVAL_MINS = 60

const LIST_CACHE_KEY = "pocket-sync:firmware-list"

// The last good list is kept, so a failed refresh (e.g. a rate limit) still
// shows versions
const baseAllFirmwaresAtom = atomWithRefresh(async (_get) => {
  try {
    const firmwares = await invokeGetFirmwareVersionsList()
    try {
      localStorage.setItem(LIST_CACHE_KEY, JSON.stringify(firmwares))
    } catch {
      // caching is best effort
    }
    return firmwares
  } catch (error) {
    const cached = localStorage.getItem(LIST_CACHE_KEY)
    if (!cached) throw error
    return (
      JSON.parse(cached) as (FirmwareListItem & { publishedAt: string })[]
    ).map((firmware) => ({
      ...firmware,
      publishedAt: new Date(firmware.publishedAt),
    }))
  }
})

export const allFirmwaresAtom = withAtomEffect(
  baseAllFirmwaresAtom,
  (_get, set) => {
    const interval = setInterval(
      async () => {
        startTransition(() => set(allFirmwaresAtom))
      },
      INTERVAL_MINS * 60 * 1000
    )

    return () => clearInterval(interval)
  }
)
