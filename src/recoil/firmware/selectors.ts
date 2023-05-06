import { selector, selectorFamily } from "recoil"
import {
  invokeGetFirmwareReleaseNotes,
  invokeGetFirmwareVersionsList,
  invokeListFiles,
  invokeReadTextFile,
} from "../../utils/invokes"
import { versionCompare } from "../../utils/versionCompare"
import { FirmwareInfo, VersionSting } from "../../types"
import { StructuredTextDocument } from "react-datocms/structured-text"
import { fileSystemInvalidationAtom } from "../atoms"

export const latestFirmwareSelector = selector<FirmwareInfo>({
  key: "latestFirmwareSelector",
  get: async () => {
    const firmwares = await invokeGetFirmwareVersionsList()

    const latestInfo: FirmwareInfo = {
      ...firmwares.latest,
      ...firmwares.latest.details,
    }

    return latestInfo
  },
})

export const previousFirmwareListSelector = selector<FirmwareInfo[]>({
  key: "previousFirmwareListSelector",
  get: async () => {
    const firmwares = await invokeGetFirmwareVersionsList()
    return firmwares.firmwares.map((f) => ({ ...f, ...f.details })) || []
  },
})

export const currentFirmwareVersionSelector = selector<{
  version: VersionSting
  build_date: string
}>({
  key: "currentFirmwareVersionSelector",
  get: async () => {
    const analoguePocketJson = await invokeReadTextFile("Analogue_Pocket.json")

    const parsedJSON = JSON.parse(analoguePocketJson) as {
      product: "Analogue Pocket"
      firmware: {
        runtime: {
          name: VersionSting
          byte: number
          build_date: string
        }
      }
    }

    return {
      version: parsedJSON.firmware.runtime.name,
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

export const FirmwareReleaseNotesSelectorFamily = selectorFamily<
  StructuredTextDocument,
  { version: string }
>({
  key: "FirmwareReleaseNotesSelectorFamily",
  get:
    ({ version }) =>
    async () => {
      const notes = await invokeGetFirmwareReleaseNotes(version)
      return notes
    },
})

export const downloadedFirmwareSelector = selector<FirmwareInfo | null>({
  key: "downloadedFirmwareSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    const latestFirmwareInfo = get(latestFirmwareSelector)
    const previousFirmware = get(previousFirmwareListSelector)
    const allFirmware = [latestFirmwareInfo, ...previousFirmware]
    const filesAtRoot = await invokeListFiles("")
    const firmwareFile = filesAtRoot.find((f) => f.endsWith(".bin"))

    if (!firmwareFile) return null
    const firmwareInfo = allFirmware.find((f) => f.filename === firmwareFile)
    return firmwareInfo || null
  },
})
