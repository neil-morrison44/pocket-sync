import {
  invokeGetFirmwareDetails,
  invokeListFiles,
  invokeReadTextFile,
} from "../../utils/invokes"
import { FirmwareInfo, FirmwareListItem } from "../../types"
import { allFirmwaresAtom } from "./atoms"
import { fsWatchAtomFamily } from "../fileSystem/atoms"
import { Atom, atom } from "jotai"
import { demoFirmwareUpdateAtom } from "../cores/atoms"
import { atomFamilyDeepEqual } from "../../utils/jotai"

export const latestFirmwareSelector = atom<Promise<FirmwareListItem>>(
  async (get) => {
    const firmwares = await get(allFirmwaresAtom)
    const [latestInfo, ..._] = firmwares
    return latestInfo
  }
)

export const currentFirmwareVersionSelector = atom<
  Promise<{
    version: string
    build_date: string
  }>
>(async (get) => {
  get(fsWatchAtomFamily("Analogue_Pocket.json"))
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
    // A version's details never change, so they're cached across restarts to
    // avoid refetching (and hitting rate limits)
    const cacheKey = `pocket-sync:firmware-details:${version}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) return JSON.parse(cached) as FirmwareInfo
    } catch {
      // storage unavailable or corrupt: fetch instead
    }

    const details = await invokeGetFirmwareDetails(version)
    details.file_name = details.download_url?.split("/").at(-1) || "unknown"
    try {
      localStorage.setItem(cacheKey, JSON.stringify(details))
    } catch {
      // caching is best effort
    }
    return details
  })
)

export const downloadedFirmwareSelector = atom<Promise<string | null>>(
  async (get) => {
    get(fsWatchAtomFamily("/"))
    const filesAtRoot = await invokeListFiles("")
    const firmwareFile = filesAtRoot.find((f) => f.endsWith(".bin"))
    return firmwareFile || null
  }
)

export const updateAvailableSelector = atom<Promise<string | null>>(
  async (get) => {
    const [latestFirmware, currentFirmware] = await Promise.all([
      get(latestFirmwareSelector),
      get(currentFirmwareVersionSelector),
    ])

    if (currentFirmware.version !== latestFirmware.version)
      return latestFirmware.version

    // Dev demo flag: preview the update UI with the firmware up to date
    if (import.meta.env.DEV && (await get(demoFirmwareUpdateAtom)))
      return `${latestFirmware.version}-demo`

    return null
  }
)
