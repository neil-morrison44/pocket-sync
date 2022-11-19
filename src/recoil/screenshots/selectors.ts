import { selector, selectorFamily } from "recoil"
import { Screenshot, VideoJSON } from "../../types"
import { fileSystemInvalidationAtom } from "../atoms"
import {
  invokeListFiles,
  invokeReadBinaryFile,
  invokeReadTextFile,
} from "../../utils/invokes"

export const VideoJSONSelectorFamily = selectorFamily<VideoJSON, string>({
  key: "VideoJSONSelectorFamily",
  get:
    (coreName) =>
    async ({ get }) => {
      get(fileSystemInvalidationAtom)
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
      const metadataBuffer = buf.slice(buf.length - 528)

      let utf8decoder = new TextDecoder()
      // The unpacking here might not be right if there's unused ranges

      let authorName = utf8decoder
        .decode(metadataBuffer.slice(0, 16 * 2))
        .replaceAll("\u0000", "")

      let coreName = utf8decoder
        .decode(metadataBuffer.slice(16 * 2, 16 * 4))
        .trim()
        .replaceAll("\u0000", "")

      let gameName = utf8decoder
        .decode(metadataBuffer.slice(16 * 6, 16 * 20))
        .trim()
        .replaceAll("\u0000", "")

      let platformName = utf8decoder
        .decode(metadataBuffer.slice(metadataBuffer.length - 16 * 10))
        .replaceAll("\u0000", "")

      return {
        file_name: fileName,
        file,
        game: gameName,
        platform: platformName,
        timestamp: new Date(file.lastModified),
        author: authorName,
        core: coreName,
      }
    },
})
