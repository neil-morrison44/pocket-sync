import { selector, selectorFamily } from "recoil"
import { invoke } from "@tauri-apps/api/tauri"
import { Screenshot, VideoJSON } from "../types"

export const VideoJSONSelectorFamily = selectorFamily<
  VideoJSON,
  { authorName: string; coreName: string }
>({
  key: "VideoJSONSelectorFamily",
  get:
    ({ authorName, coreName }) =>
    async () => {
      const jsonText = await invoke<string>("get_video_json", {
        authorName,
        coreName,
      })

      return JSON.parse(jsonText) as VideoJSON
    },
})

export const screenshotsListSelector = selector<string[]>({
  key: "screenshotsListSelector",
  get: async () => await invoke<string[]>("list_screenshots"),
})

export const SingleScreenshotSelectorFamily = selectorFamily<
  Screenshot | null,
  string
>({
  key: "SingleScreenshotSelectorFamily",
  get: (fileName) => async () => {
    const data = await invoke<number[]>("get_screenshot", {
      fileName,
    })
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
