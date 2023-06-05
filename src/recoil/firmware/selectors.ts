import { selector, selectorFamily } from "recoil"
import {
  invokeGetFirmwareDetails,
  invokeGetFirmwareVersionsList,
  invokeListFiles,
  invokeReadTextFile,
} from "../../utils/invokes"
import { versionCompare } from "../../utils/versionCompare"
import { FirmwareInfo, FirmwareListItem } from "../../types"
import { fileSystemInvalidationAtom } from "../atoms"

export const latestFirmwareSelector = selector<FirmwareListItem>({
  key: "latestFirmwareSelector",
  get: async () => {
    const firmwares = await invokeGetFirmwareVersionsList()
    const [latestInfo, ..._] = firmwares
    return latestInfo
  },
})

export const previousFirmwareListSelector = selector<FirmwareListItem[]>({
  key: "previousFirmwareListSelector",
  get: async () => {
    const firmwares = await invokeGetFirmwareVersionsList()
    const [_, ...previousFirmwares] = firmwares
    return previousFirmwares
  },
})

export const currentFirmwareVersionSelector = selector<{
  version: string
  build_date: string
}>({
  key: "currentFirmwareVersionSelector",
  get: async () => {
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

export const firmwareUpdateableSelector = selector<boolean>({
  key: "firmwareUpdateableSelector",
  get: async ({ get }) => {
    const latestFirmware = get(latestFirmwareSelector)
    const currentFirmware = get(currentFirmwareVersionSelector)

    return versionCompare(currentFirmware.version, latestFirmware.version)
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
    const latestFirmwareInfo = get(latestFirmwareSelector)
    const previousFirmware = get(previousFirmwareListSelector)
    const allFirmware = [latestFirmwareInfo, ...previousFirmware]
    const filesAtRoot = await invokeListFiles("")
    const firmwareFile = filesAtRoot.find((f) => f.endsWith(".bin"))

    return firmwareFile || null
    // if (!firmwareFile) return null
    // const firmwareInfo = allFirmware.find((f) => f.file_name === firmwareFile)
    // return firmwareInfo || null
  },
})
