import { selector, selectorFamily } from "recoil"
import { Screenshot, VideoJSON } from "../../types"
import { fileSystemInvalidationAtom } from "../atoms"
import {
  invokeFileExists,
  invokeListFiles,
  invokeReadBinaryFile,
} from "../../utils/invokes"
import { getBinaryMetadata } from "../../utils/getBinaryMetadata"
import { readJSONFile } from "../../utils/readJSONFile"

export const VideoJSONSelectorFamily = selectorFamily<VideoJSON, string>({
  key: "VideoJSONSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
      const exists = await invokeFileExists(`Cores/${coreName}/video.json`)
      if (!exists)
        return {
          video: {
            scaler_modes: [],
            magic: "APF_VER_1",
          },
        }

      return readJSONFile<VideoJSON>(`Cores/${coreName}/video.json`)
    },
})

export const screenshotsListSelector = selector<string[]>({
  key: "screenshotsListSelector",
  get: async ({ get }) => {
    get(fileSystemInvalidationAtom)
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
      get(fileSystemInvalidationAtom)

      const data = await invokeReadBinaryFile(
        `Memories/Screenshots/${fileName}`
      )
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

export const SingleScaledScreenshotImageSelectorFamily = selectorFamily<
  HTMLImageElement | null,
  string
>({
  key: "SingleScaledScreenshotImageSelectorFamily",
  get:
    (fileName) =>
    async ({ get }) => {
      const SCALE = 4
      const image = get(SingleScreenshotImageSelectorFamily(fileName))
      if (!image) return null

      const canvas = document.createElement("canvas")
      canvas.width = image.width * SCALE
      canvas.height = image.height * SCALE

      const context = canvas.getContext("2d")
      if (!context) return null
      context.imageSmoothingEnabled = false
      context.drawImage(image, 0, 0, image.width * SCALE, image.height * SCALE)

      const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) return reject()
          const scaledImage = new Image()
          scaledImage.src = URL.createObjectURL(blob)
          resolve(scaledImage)
        })
      })

      return loadPromise
    },
})
