import { decodeThumbnail } from "../../utils/decodeSaveStateThumbnail"
import {
  getBinaryMetadata,
  getCartridgeBinaryMetadata,
} from "../../utils/getBinaryMetadata"
import { invokeReadBinaryFile } from "../../utils/invokes"
import { PhotoColourMapAtom } from "./atoms"
import { FileWatchAtomFamily, FolderWatchAtomFamily } from "../fileSystem/atoms"
import { WalkDirSelectorFamily } from "../selectors"
import { Atom, atom } from "jotai"
import { atomFamily } from "jotai/utils"
import { atomFamilyDeepEqual } from "../../utils/jotai"

export const AllSaveStatesSelector = atom<Promise<string[]>>(async (get) => {
  const saves = await get(
    WalkDirSelectorFamily({
      path: "Memories/Save States",
      extensions: [".sta"],
    })
  )
  return saves.map((f) => f.replace(/^\//g, ""))
})

const SaveStateBinarySelectorFamily = atomFamily<
  string,
  Atom<Promise<Uint8Array>>
>((path) =>
  atom(async () => {
    const file = await invokeReadBinaryFile(`Memories/Save States/${path}`)
    return file
  })
)

export const SaveStateImageSelectorFamily = atomFamily<
  string,
  Atom<Promise<string>>
>((path) =>
  atom(async (get) => {
    const binary = await get(SaveStateBinarySelectorFamily(path))
    const imageSrc = decodeThumbnail(binary)
    return imageSrc
  })
)

export const SaveStateMetadataSelectorFamily = atomFamily<
  string,
  Atom<
    Promise<{ author: string; core: string; game: string; platform: string }>
  >
>((path) =>
  atom(async (get) => {
    const binary = await get(SaveStateBinarySelectorFamily(path))
    const metadata = !path.includes("/")
      ? getCartridgeBinaryMetadata(binary, false)
      : getBinaryMetadata(binary)
    return metadata
  })
)

export const ReadSavForStaSelectorFamily = atomFamily<
  string,
  Atom<Promise<Uint8Array>>
>((path) =>
  atom(async (get) => {
    const savPath = path.replace(".sta", ".sav")
    const fullpath = `Memories/Save States/${savPath}`
    get(FileWatchAtomFamily(fullpath))
    return await invokeReadBinaryFile(fullpath)
  })
)

const PHOTO_OFFSET = 0x2000
const PHOTO_OFFSET_23_PLUS = 0x2001
const PHOTO_SIZE = 0x1000

const SIZE_LARGE = 0xe00
const SIZE_SMALL = 0x100
const SIZE_INFO = 0x100

export const PhotoExportImageSelectorFamily = atomFamilyDeepEqual<
  { path: string; index: number },
  Atom<Promise<string>>
>(({ path, index }) =>
  atom(async (get) => {
    const saveData = await get(ReadSavForStaSelectorFamily(path))
    const canvas = document.createElement("canvas")
    canvas.width = 128
    canvas.height = 112

    const context = canvas.getContext("2d")
    if (!context) throw new Error("Failed to get Canvas")
    const tileImageData = context.getImageData(0, 0, 8, 8)

    // The word "Magic" appears in the RAM at a known location
    // Can check if it's there or not to find out if it's the new save state format or the older one
    const magicSlice = saveData.slice(0x02fca, 0x02fce + 1)
    const magicWord = Array.from(magicSlice)
      .map((v) => String.fromCharCode(v))
      .join("")
      .trim()
    const isMagic = magicWord === "Magic"
    const photoOffset = isMagic ? PHOTO_OFFSET : PHOTO_OFFSET_23_PLUS

    const photos = saveData.slice(photoOffset + PHOTO_SIZE * index)
    const large = photos.slice(0, SIZE_LARGE)
    const colourMap = await get(PhotoColourMapAtom)

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
  })
)
