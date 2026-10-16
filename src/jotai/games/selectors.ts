import { sep } from "@tauri-apps/api/path"
import {
  invokeFileExists,
  invokeFileMetadata,
  invokeListFolders,
  invokeListInstancePackageableCores,
  invokeReadBinaryFile,
  invokeWalkDirListFiles,
} from "../../utils/invokes"
import { fsWatchAtomFamily } from "../fileSystem/atoms"
import { Atom, atom } from "jotai"
import { atomFamilyDeepEqual, keepPreviousOrSuspend } from "../../utils/jotai"
import { path } from "@tauri-apps/api"
import { MROMInfo, PlatformId } from "../../types"
import {
  CoreInfoSelectorFamily,
  DataJSONSelectorFamily,
  WalkDirSelectorFamily,
  coresListSelector,
} from "../selectors"
import { decodeDataParams } from "../../utils/decodeDataParams"
import {
  PlatformExistsSelectorFamily,
  PlatformInfoSelectorFamily,
} from "../platforms/selectors"
import { atomFamily } from "jotai-family"

export const instancePackagerCoresListSelector = atom<Promise<string[]>>(
  async (get) => {
    get(fsWatchAtomFamily("Cores"))
    return await invokeListInstancePackageableCores()
  }
)

export const mromDumpedROMSListSelector = atom<Promise<MROMInfo[]>>(
  async (get) => {
    const MROM_ROOT = "Assets/mrom/common"
    get(fsWatchAtomFamily(MROM_ROOT))
    const dumps = await invokeWalkDirListFiles(MROM_ROOT, ["GB", "GBC"])
    const results: MROMInfo[] = []

    for (let index = 0; index < dumps.length; index++) {
      const filePath = `${MROM_ROOT}${dumps[index]}`
      const metadata = await invokeFileMetadata(filePath)
      const [_, platform, name] = dumps[index].split(path.sep())

      const dumpedSaveFilePath = filePath.replace(/\.gbc|.gb/i, ".SAV")
      const dumpedSaveFileExists = await invokeFileExists(dumpedSaveFilePath)

      const pocketSaveFilePath = filePath
        .replace("Assets", "Saves")
        .replace(/\.gbc|.gb/, ".sav")
      const pocketSaveFileExists = await invokeFileExists(pocketSaveFilePath)

      results.push({
        platform: platform as "DMG" | "CGB",
        path: filePath,
        name,
        crc32: metadata.crc32.toString(16),
        dumpedSave: dumpedSaveFileExists ? dumpedSaveFilePath : undefined,
        pocketSave: pocketSaveFileExists ? pocketSaveFilePath : undefined,
      })
    }
    return results
  }
)

const IMAGE_SELECTOR_SCRATCH_CANVAS = document.createElement("canvas")

export const libraryImageSelector = atomFamilyDeepEqual<
  { crc32: string; platform: string },
  Atom<Promise<string>>
>(({ crc32, platform }) =>
  atom(async (_get) => {
    const platformTranslate = {
      DMG: "GB",
      CGB: "GB",
    } as Record<string, string>

    const filePath = `System/Library/Images/${
      platformTranslate[platform] ?? platform
    }/${crc32}.bin`
    const exists = await invokeFileExists(filePath)
    const canvas = IMAGE_SELECTOR_SCRATCH_CANVAS
    const context = canvas.getContext("2d")
    if (!context) return ""

    if (!exists) {
      canvas.width = 140
      canvas.height = 140

      context.fillStyle = "rgb(200,200,200)"
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = "rgb(235,235,235)"
      context.fillRect(10, 10, canvas.width - 20, canvas.height - 20)

      context.font = "120px GamePocket"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillStyle = "rgb(20,20,20)"
      context.fillText("?", canvas.width / 2, canvas.height / 2 + 10)
    } else {
      const file = await invokeReadBinaryFile(filePath)

      const header = file.slice(0, 8)
      const _magic = header.slice(0, 4)
      const widthSlice = header.slice(4, 6)
      const heightSlice = header.slice(6, 8)

      const width = widthSlice[0] + (widthSlice[1] ? widthSlice[1] + 255 : 0)
      const height =
        heightSlice[0] + (heightSlice[1] ? heightSlice[1] + 255 : 0)

      canvas.width = width
      canvas.height = height
      const imageSlice = file.slice(8)

      let x = 0
      let y = 0
      const imageDataScratch = context.createImageData(1, 1)

      for (let index = 0; index < imageSlice.length; index += 4) {
        const [b, g, r, a] = imageSlice.slice(index, index + 4)

        imageDataScratch.data[0] = r
        imageDataScratch.data[1] = g
        imageDataScratch.data[2] = b
        imageDataScratch.data[3] = a
        context?.putImageData(imageDataScratch, width - y - 1, x)

        if (++x === height) {
          x = 0
          y++
        }
      }
    }

    const canvasBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve)
    )

    if (!canvasBlob) return ""
    return URL.createObjectURL(canvasBlob)
  })
)

// Slots named like this hold games even when they aren't required
const MAYBE_GAME_SLOT_NAMES = /(^slot)/i

export type GameSystem = {
  platformId: PlatformId
  /** File extensions any installed core for this system loads as games. */
  extensions: string[]
  /** Fixed file names (BIOS etc.) in the folder that aren't games. */
  namedFiles: string[]
  /** Installed cores that read games from this system's folder. */
  cores: string[]
}

/**
 * Systems with a games folder (`Assets/<platform>`), derived from the
 * installed cores' data slots, the same way the per-core game counts are.
 */
/**
 * Console platforms whose games can be listed without a core installed
 * (their folders on the card, the ROM extensions and a name for when the
 * card has no platform file yet). Other folders under Assets often hold
 * files that aren't games, so they're only listed through a core.
 */
const KNOWN_GAME_SYSTEMS: Record<
  string,
  { extensions: string[]; name: string }
> = {
  gb: { extensions: ["gb", "GB"], name: "Game Boy" },
  gbc: { extensions: ["gbc", "GBC", "gb", "GB"], name: "Game Boy Color" },
  gba: { extensions: ["gba", "GBA"], name: "Game Boy Advance" },
  gg: { extensions: ["gg", "GG"], name: "Game Gear" },
  sms: { extensions: ["sms", "SMS"], name: "Master System" },
  nes: { extensions: ["nes", "NES"], name: "NES" },
  snes: { extensions: ["sfc", "smc", "SFC", "SMC"], name: "Super NES" },
  genesis: { extensions: ["md", "gen", "smd", "MD"], name: "Genesis" },
  pce: { extensions: ["pce", "PCE"], name: "PC Engine" },
  ngp: { extensions: ["ngp", "ngc", "NGP", "NGC"], name: "Neo Geo Pocket" },
  lynx: { extensions: ["lnx", "LNX"], name: "Lynx" },
  wonderswan: { extensions: ["ws", "wsc", "WS", "WSC"], name: "WonderSwan" },
}

/** A built-in name for a known platform, e.g. "Game Boy" for `gb`. */
export const knownGameSystemName = (platformId: string) =>
  KNOWN_GAME_SYSTEMS[platformId]?.name

const gameSystemsLoadSelector = atom<Promise<GameSystem[]>>(async (get) => {
  get(fsWatchAtomFamily("Assets"))
  const coreNames = await get(coresListSelector)
  const systems = new Map<
    PlatformId,
    { extensions: Set<string>; namedFiles: Set<string>; cores: string[] }
  >()

  for (const coreName of coreNames) {
    try {
      const data = await get(DataJSONSelectorFamily(coreName))
      const romsSlot = data.data.data_slots.find(
        ({ required, name, extensions }) =>
          (required || name?.match(MAYBE_GAME_SLOT_NAMES)) && extensions
      )
      if (!romsSlot) continue

      const { core } = await get(CoreInfoSelectorFamily(coreName))
      const { platformIndex } = decodeDataParams(romsSlot.parameters)
      const platformId = core.metadata.platform_ids[platformIndex]
      if (!platformId) continue

      const system = systems.get(platformId) ?? {
        extensions: new Set<string>(),
        namedFiles: new Set<string>(),
        cores: [],
      }
      romsSlot.extensions?.forEach((extension) =>
        system.extensions.add(extension)
      )
      data.data.data_slots.forEach(
        ({ filename }) => filename && system.namedFiles.add(filename)
      )
      system.cores.push(coreName)
      systems.set(platformId, system)
    } catch (error) {
      // a core with broken JSON shouldn't hide every other system
      console.warn(`Skipping ${coreName} in games list`, error)
    }
  }

  // Known systems with a folder on the card but no core for them, e.g.
  // games copied over before the core is installed
  const assetFolders = await invokeListFolders("Assets")
  for (const folder of assetFolders) {
    const known = KNOWN_GAME_SYSTEMS[folder]
    if (!known || systems.has(folder)) continue
    systems.set(folder, {
      extensions: new Set(known.extensions),
      namedFiles: new Set(),
      cores: [],
    })
  }

  return [...systems]
    .map(([platformId, { extensions, namedFiles, cores }]) => ({
      platformId,
      extensions: [...extensions],
      namedFiles: [...namedFiles],
      cores,
    }))
    .sort((a, b) => a.platformId.localeCompare(b.platformId))
})

/**
 * The systems with games on the SD card. When files in Assets change (e.g.
 * after Clean Up Files) the previous list stays until the new one is read,
 * so the Games page doesn't flash back to its loading state.
 */
export const gameSystemsSelector = keepPreviousOrSuspend(
  gameSystemsLoadSelector
)

/** A system's files (like `WalkDirSelectorFamily`), kept while re-read. */
export const GameSystemFilesSelectorFamily = atomFamilyDeepEqual(
  (params: { path: string; extensions: string[] }) =>
    keepPreviousOrSuspend(WalkDirSelectorFamily(params))
)

/** Game files in a system's folder: everything but its fixed (BIOS) files. */
export const filterGameFiles = (files: string[], namedFiles: string[]) =>
  files.filter((file) => !namedFiles.some((named) => file.endsWith(named)))

/** Total number of games across all systems on the SD card. */
export const installedGamesCountSelector = atom<Promise<number>>(
  async (get) => {
    const systems = await get(gameSystemsSelector)
    const counts = await Promise.all(
      systems.map(async ({ platformId, extensions, namedFiles }) => {
        const files = await get(
          WalkDirSelectorFamily({ path: `Assets/${platformId}`, extensions })
        )
        return filterGameFiles(files, namedFiles).length
      })
    )
    return counts.reduce((total, count) => total + count, 0)
  }
)

/** Each game system's platform name, for the platform filter. */
export const gameSystemOptionsSelector = atom<
  Promise<{ platformId: PlatformId; name: string }[]>
>(async (get) => {
  const systems = await get(gameSystemsSelector)
  const options = await Promise.all(
    systems.map(async ({ platformId }) => {
      try {
        const { platform } = await get(PlatformInfoSelectorFamily(platformId))
        return { platformId, name: platform.name }
      } catch {
        return {
          platformId,
          name: knownGameSystemName(platformId) ?? platformId,
        }
      }
    })
  )
  return options.sort((a, b) => a.name.localeCompare(b.name))
})

/**
 * A game system's platform info from the card, or a built-in name for a
 * known platform whose file isn't on the card yet (no core installed).
 */
export const GameSystemPlatformSelectorFamily = atomFamily(
  (platformId: PlatformId) =>
    atom(
      async (
        get
      ): Promise<{
        name: string
        category?: string
        manufacturer?: string
        /** Whether the card has the platform's file (so it can be linked). */
        exists: boolean
      }> => {
        const exists = await get(PlatformExistsSelectorFamily(platformId))
        if (!exists) {
          return {
            name: knownGameSystemName(platformId) ?? platformId,
            exists,
          }
        }
        const { platform } = await get(PlatformInfoSelectorFamily(platformId))
        return { ...platform, exists }
      }
    )
)

/** The categories of the game systems (e.g. Handheld), for the filter. */
export const gameSystemCategoriesSelector = atom<Promise<string[]>>(
  async (get) => {
    const systems = await get(gameSystemsSelector)
    const platforms = await Promise.all(
      systems.map(({ platformId }) =>
        get(GameSystemPlatformSelectorFamily(platformId))
      )
    )
    return Array.from(
      new Set(platforms.map(({ category }) => category).filter(Boolean))
    ).sort((a, b) => (a as string).localeCompare(b as string)) as string[]
  }
)
