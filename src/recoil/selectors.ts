import { selector, selectorFamily } from "recoil"
import { invoke } from "@tauri-apps/api/tauri"
import { Screenshot } from "../types"
import { inflate } from "fflate"

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
    const compressedBuf = new Uint8Array(data)
    const buf = await new Promise<Uint8Array>((resolve) => {
      inflate(new Uint8Array(compressedBuf), {}, (err, inflated) =>
        resolve(inflated)
      )
    })

    const file = new File([buf], fileName, { type: "image/png" })

    const metadataBuffer = buf.slice(buf.length - 528)

    console.log({ metadataBuffer })

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

    console.log({ authorName, coreName, gameName, platformName })

    return {
      file_name: fileName,
      file,
      game: gameName,
      platform: platformName,
      timestamp: new Date(file.lastModified),
    }
  },
})
