import { selector, selectorFamily } from "recoil"
import { FileWatchAtomFamily, FolderWatchAtomFamily } from "../fileSystem/atoms"
import {
  invokeReadBinaryFile,
  invokeWalkDirListFiles,
} from "../../utils/invokes"
import { Palette, rgb } from "../../types"

export const palettesListSelector = selector<string[]>({
  key: "palettesListSelector",
  get: async ({ get }) => {
    const path = "Assets/gb/common/palettes"
    get(FolderWatchAtomFamily(path))
    const platforms = await invokeWalkDirListFiles(path, ["pal"])
    return platforms
  },
})

export const PaletteColoursSelectorFamily = selectorFamily<Palette, string>({
  key: "PaletteColoursSelectorFamily",
  get:
    (name: string) =>
    async ({ get }) => {
      const path = `Assets/gb/common/palettes${name}`
      get(FileWatchAtomFamily(path))
      const data = await invokeReadBinaryFile(path)

      return {
        background: parsePalette(data.subarray(0, 12)),
        obj0: parsePalette(data.subarray(12, 24)),
        obj1: parsePalette(data.subarray(24, 36)),
        window: parsePalette(data.subarray(36, 48)),
        off: Array.from(data.subarray(48, 51)) as rgb,
      } satisfies Palette
    },
})

const parsePalette = (data: Uint8Array): [rgb, rgb, rgb, rgb] => {
  return data
    .reduce(
      (acc, current, index) => {
        const palIndex = Math.floor(index / 3)
        acc[palIndex].push(current)
        return acc
      },
      [[], [], [], []] as number[][]
    )
    .reverse() as [rgb, rgb, rgb, rgb]
}

export const GameBoyGameSelectorFamily = selectorFamily<Uint8Array, string>({
  key: "GameBoyGameSelectorFamily",
  get:
    (game: string) =>
    async ({ get }) => {
      const path = `Assets/gb/${game}`
      get(FileWatchAtomFamily(path))
      const data = await invokeReadBinaryFile(path)
      return data
    },
})

export const PaletteCodeSelectorFamily = selectorFamily<string, string>({
  key: "PaletteCodeSelectorFamily",
  get:
    (name: string) =>
    async ({ get }) => {
      const path = `Assets/gb/common/palettes${name}`
      get(FileWatchAtomFamily(path))
      const data = await invokeReadBinaryFile(path)

      return (
        Array.from(data)
          .map((s) => s.toString(16).padStart(2, "0"))
          .join("") + btoa(name)
      )
    },
})
