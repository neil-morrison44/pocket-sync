import { selector, selectorFamily } from "recoil"
import {
  invokeGetFirmwareDetails,
  invokeListFiles,
  invokeReadTextFile,
} from "../../utils/invokes"
import { FirmwareInfo, FirmwareListItem } from "../../types"
import { fileSystemInvalidationAtom } from "../atoms"
import { allFirmwaresAtom } from "./atoms"

export const latestFirmwareSelector = selector<FirmwareListItem>({
  key: "latestFirmwareSelector",
  get: async ({ get }) => {
    const firmwares = get(allFirmwaresAtom)
    const [latestInfo, ..._] = firmwares
    return latestInfo
  },
})

export const previousFirmwareListSelector = selector<FirmwareListItem[]>({
  key: "previousFirmwareListSelector",
  get: async ({ get }) => {
    const firmwares = get(allFirmwaresAtom)
    const [_, ...previousFirmwares] = firmwares
    return previousFirmwares
  },
})

export const currentFirmwareVersionSelector = selector<{
  version: string
  build_date: string
}>({
  key: "currentFirmwareVersionSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    const analoguePocketJson = await invokeReadTextFile("Analogue_Pocket.json")
    const parsedJSON = JSON.parse(analoguePocketJson) as {
      product: "Analogue Pocket"
      firmware: {
        runtime: {
          name: string
          byte: number
          build_date: string
        }
      }
    }
    const hexValue = parsedJSON.firmware.runtime.byte.toString(16)
    const version = hexValue.startsWith("b")
      ? `1.1-beta-${hexValue[1]}`
      : `${hexValue[0]}.${hexValue[1]}`

    return {
      version,
      build_date: parsedJSON.firmware.runtime.build_date,
    }
  },
})

export const FirmwareDetailsSelectorFamily = selectorFamily<
  FirmwareInfo,
  { version: string }
>({
  key: "FirmwareDetailsSelectorFamily",
  get:
    ({ version }) =>
    async () => {
      const details = await invokeGetFirmwareDetails(version)
      details.file_name = details.download_url?.split("/").at(-1) || "unknown"
      return details
    },
})

export const downloadedFirmwareSelector = selector<string | null>({
  key: "downloadedFirmwareSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    const filesAtRoot = await invokeListFiles("")
    const firmwareFile = filesAtRoot.find((f) => f.endsWith(".bin"))
    return firmwareFile || null
  },
})

export const updateAvailableSelector = selector<string | null>({
  key: "updateAvailableSelector",
  get: async ({ get }) => {
    const latestFirmware = get(latestFirmwareSelector)
    const currentFirmware = get(currentFirmwareVersionSelector)

    if (currentFirmware.version !== latestFirmware.version) {
      return latestFirmware.version
    }
    return null
  },
})
