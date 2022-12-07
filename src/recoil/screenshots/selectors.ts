import { selector, selectorFamily } from "recoil"
import { Screenshot, VideoJSON } from "../../types"
import { fileSystemInvalidationAtom } from "../atoms"
import {
  invokeFileExists,
  invokeListFiles,
  invokeReadBinaryFile,
  invokeReadTextFile,
} from "../../utils/invokes"
import { getBinaryMetadata } from "../../utils/getBinaryMetadata"

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
      const jsonText = await invokeReadTextFile(`Cores/${coreName}/video.json`)
      return JSON.parse(jsonText) as VideoJSON
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
