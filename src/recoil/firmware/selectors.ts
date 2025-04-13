import {
  invokeGetFirmwareDetails,
  invokeListFiles,
  invokeReadTextFile,
} from "../../utils/invokes"
import { FirmwareInfo, FirmwareListItem } from "../../types"
import { allFirmwaresAtom } from "./atoms"
import { FileWatchAtomFamily, FolderWatchAtomFamily } from "../fileSystem/atoms"
import { Atom, atom } from "jotai"
import { atomFamilyDeepEqual } from "../../utils/jotai"

export const latestFirmwareSelector = atom<Promise<FirmwareListItem>>(
  async (get) => {
    const firmwares = await get(allFirmwaresAtom)
    const [latestInfo, ..._] = firmwares
    return latestInfo
  }
)

export const previousFirmwareListSelector = atom<Promise<FirmwareListItem[]>>(
  async (get) => {
    const firmwares = await get(allFirmwaresAtom)
    const [_, ...previousFirmwares] = firmwares
    return previousFirmwares
  }
)

export const currentFirmwareVersionSelector = atom<
  Promise<{
    version: string
    build_date: string
  }>
>(async (get) => {
  get(FileWatchAtomFamily("Analogue_Pocket.json"))
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
})

export const FirmwareDetailsSelectorFamily = atomFamilyDeepEqual<
  { version: string },
  Atom<Promise<FirmwareInfo>>
>(({ version }) =>
  atom(async () => {
    const details = await invokeGetFirmwareDetails(version)
    details.file_name = details.download_url?.split("/").at(-1) || "unknown"
    return details
  })
)

export const downloadedFirmwareSelector = atom<Promise<string | null>>(
  async (get) => {
    get(FolderWatchAtomFamily("/"))
    const filesAtRoot = await invokeListFiles("")
    const firmwareFile = filesAtRoot.find((f) => f.endsWith(".bin"))
    return firmwareFile || null
  }
)

export const updateAvailableSelector = atom<Promise<string | null>>(
  async (get) => {
    const latestFirmware = await get(latestFirmwareSelector)
    const currentFirmware = await get(currentFirmwareVersionSelector)

    if (currentFirmware.version !== latestFirmware.version)
      return latestFirmware.version

    return null
  }
)
