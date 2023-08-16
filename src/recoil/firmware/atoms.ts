import { atom } from "recoil"
import { FirmwareListItem } from "../../types"
import { invokeGetFirmwareVersionsList } from "../../utils/invokes"

const INTERVAL_MINS = 60

export const allFirmwaresAtom = atom<FirmwareListItem[]>({
  key: "allFirmwaresSelector",
  default: (async () => {
    const firmwares = await invokeGetFirmwareVersionsList()
    return firmwares
  })(),
  effects: [
    ({ setSelf }) => {
      setInterval(async () => {
        const newFirmwares = await invokeGetFirmwareVersionsList()
        setSelf(newFirmwares)
      }, INTERVAL_MINS * 60 * 1000)
    },
  ],
})
