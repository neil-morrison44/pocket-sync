import { selector, selectorFamily } from "recoil"
import { decodeThumbnail } from "../../utils/decodeSaveStateThumbnail"
import {
  getBinaryMetadata,
  getCartridgeBinaryMetadata,
} from "../../utils/getBinaryMetadata"
import {
  invokeReadBinaryFile,
  invokeWalkDirListFiles,
} from "../../utils/invokes"
import { fileSystemInvalidationAtom } from "../atoms"
import { PhotoColourMapAtom } from "./atoms"

export const AllSaveStatesSelector = selector<string[]>({
  key: "AllSaveStatesSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
    const saves = await invokeWalkDirListFiles("Memories/Save States", [".sta"])
    return saves.map((f) => f.replace(/^\//g, ""))
  },
})

const SaveStateBinarySelectorFamily = selectorFamily<Uint8Array, string>({
  key: "SaveStateBinarySelectorFamily",
  get: (path) => async () => {
    const file = await invokeReadBinaryFile(`Memories/Save States/${path}`)
    return file
  },
})

export const SaveStateImageSelectorFamily = selectorFamily<string, string>({
  key: "SaveStateImageSelectorFamily",
  get:
    (path) =>
    async ({ get }) => {
      const binary = get(SaveStateBinarySelectorFamily(path))
      const imageSrc = decodeThumbnail(binary)
      return imageSrc
    },
})

export const SaveStateMetadataSelectorFamily = selectorFamily<
  { author: string; core: string; game: string; platform: string },
  string
>({
  key: "SaveStateMetadataSelectorFamily",
  get:
    (path) =>
    async ({ get }) => {
      const binary = get(SaveStateBinarySelectorFamily(path))
      const metadata = !path.includes("/")
        ? getCartridgeBinaryMetadata(binary, false)
        : getBinaryMetadata(binary)
      return metadata
    },
})

export const ReadSavForStaSelectorFamily = selectorFamily<Uint8Array, string>({
  key: "ReadSavForStaSelectorFamily",
  get:
    (path) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const savPath = path.replace(".sta", ".sav")
      const file = await invokeReadBinaryFile(`Memories/Save States/${savPath}`)
      return file
    },
})

const PHOTO_OFFSET = 0x2000
const PHOTO_SIZE = 0x1000

const SIZE_LARGE = 0xe00
const SIZE_SMALL = 0x100
const SIZE_INFO = 0x100

export const PhotoExportImageSelectorFamily = selectorFamily<
  string,
  { path: string; index: number }
>({
  key: "PhotoExportImageSelectorFamily",

  get:
    ({ path, index }) =>
    async ({ get }) => {
      const saveData = get(ReadSavForStaSelectorFamily(path))
      const canvas = document.createElement("canvas")
      canvas.width = 128
      canvas.height = 112

      const context = canvas.getContext("2d")
      if (!context) throw new Error("Failed to get Canvas")
      const tileImageData = context.getImageData(0, 0, 8, 8)

      const photos = saveData.slice(PHOTO_OFFSET + PHOTO_SIZE * index)
      const large = photos.slice(0, SIZE_LARGE)
      const colourMap = get(PhotoColourMapAtom)

      const loadTile = (slice: Uint8Array, imageData: ImageData) => {
        const bytes = slice

        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const pixelMask = 1 << (7 - x)
            let colourOfPixel = 0
            const bitValueOfByte1 = bytes[y * 2 + 0] & pixelMask
            const bitValueOfByte2 = bytes[y * 2 + 1] & pixelMask
            if (bitValueOfByte1) colourOfPixel += 1
            if (bitValueOfByte2) colourOfPixel += 2

            const offset = (x + y * 8) * 4
            imageData.data[offset + 0] = colourMap[colourOfPixel][0]
            imageData.data[offset + 1] = colourMap[colourOfPixel][1]
            imageData.data[offset + 2] = colourMap[colourOfPixel][2]
            imageData.data[offset + 3] = 255
          }
        }
      }

      for (let index = 0; index < large.length; index += 16) {
        loadTile(large.slice(index, index + 16), tileImageData)
        const pix_index = index / 16
        const tile_col: number = pix_index % 16
        const tile_row: number = Math.floor(pix_index / 16)
        context.putImageData(tileImageData, tile_col * 8, tile_row * 8)
      }

      return canvas.toDataURL()
    },
})
