import { sep } from "@tauri-apps/api/path"
import {
  invokeFileExists,
  invokeFileMetadata,
  invokeListInstancePackageableCores,
  invokeReadBinaryFile,
  invokeWalkDirListFiles,
} from "../../utils/invokes"
import { fsWatchAtomFamily } from "../fileSystem/atoms"
import { Atom, atom } from "jotai"
import { atomFamilyDeepEqual } from "../../utils/jotai"
import { path } from "@tauri-apps/api"
import { MROMInfo, PlatformId } from "../../types"
import {
  CoreInfoSelectorFamily,
  DataJSONSelectorFamily,
  coresListSelector,
} from "../selectors"
import { decodeDataParams } from "../../utils/decodeDataParams"

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
export const gameSystemsSelector = atom<Promise<GameSystem[]>>(async (get) => {
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

  return [...systems]
    .map(([platformId, { extensions, namedFiles, cores }]) => ({
      platformId,
      extensions: [...extensions],
      namedFiles: [...namedFiles],
      cores,
    }))
    .sort((a, b) => a.platformId.localeCompare(b.platformId))
})
