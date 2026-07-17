import { invokeGetFirmwareVersionsList } from "../../utils/invokes"
import { atomWithRefresh } from "jotai/utils"
import { withAtomEffect } from "jotai-effect"
import { startTransition } from "react"

const INTERVAL_MINS = 60

const baseAllFirmwaresAtom = atomWithRefresh(
  async (_get) => await invokeGetFirmwareVersionsList()
)

export const allFirmwaresAtom = withAtomEffect(
  baseAllFirmwaresAtom,
  (_get, set) => {
    const interval = setInterval(async () => {
      startTransition(() => set(allFirmwaresAtom))
    }, INTERVAL_MINS * 60 * 1000)

    return () => clearInterval(interval)
  }
)
