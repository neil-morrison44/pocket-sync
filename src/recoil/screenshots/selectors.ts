import { selector, selectorFamily } from "recoil"
import { Screenshot, VideoJSON } from "../../types"
import {
  invokeFileExists,
  invokeListFiles,
  invokeReadBinaryFile,
} from "../../utils/invokes"
import { getBinaryMetadata } from "../../utils/getBinaryMetadata"
import { readJSONFile } from "../../utils/readJSONFile"
import { FileWatchAtomFamily, FolderWatchAtomFamily } from "../fileSystem/atoms"

export const VideoJSONSelectorFamily = selectorFamily<VideoJSON, string>({
  key: "VideoJSONSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      const path = `Cores/${coreName}/video.json`
      get(FileWatchAtomFamily(path))
      const exists = await invokeFileExists(path)
      if (!exists)
        return {
          video: {
            scaler_modes: [],
            magic: "APF_VER_1",
          },
        }

      return readJSONFile<VideoJSON>(path)
    },
})

export const screenshotsListSelector = selector<string[]>({
  key: "screenshotsListSelector",
  get: async ({ get }) => {
    get(FolderWatchAtomFamily("Memories/Screenshots"))
    return await invokeListFiles("Memories/Screenshots")
  },
})

export const SingleScreenshotSelectorFamily = selectorFamily<
  Screenshot | null,
  string
>({
  key: "SingleScreenshotSelectorFamily",
  get:
    (fileName) =>
    async ({ get }) => {
      const path = `Memories/Screenshots/${fileName}`
      get(FileWatchAtomFamily(path))

      const data = await invokeReadBinaryFile(path)
      const buf = new Uint8Array(data)
      const file = new File([buf], fileName, { type: "image/png" })
      const metadata = getBinaryMetadata(buf, true)

      return {
        file,
        file_name: fileName,
        timestamp: new Date(file.lastModified),
        ...metadata,
      }
    },
})

export const SingleScreenshotImageSelectorFamily = selectorFamily<
  HTMLImageElement | null,
  string
>({
  key: "SingleScreenshotImageSelectorFamily",
  get:
    (fileName) =>
    async ({ get }) => {
      const screenshot = get(SingleScreenshotSelectorFamily(fileName))
      if (!screenshot) return null

      const image = new Image()

      const loadPromise = new Promise<HTMLImageElement>((resolve) => {
        image.onload = () => resolve(image)
      })

      image.src = URL.createObjectURL(screenshot.file)
      return loadPromise
    },
})

export const ImageDimensionsSelectorFamily = selectorFamily<
  { width: number; height: number },
  string
>({
  key: "ImageDimensionsSelectorFamily",
  get: (src) => async () => {
    const image = new Image()
    image.src = src

    return new Promise<{ width: number; height: number }>((resolve) => {
      image.onload = () => resolve({ width: image.width, height: image.height })
    })
  },
})
