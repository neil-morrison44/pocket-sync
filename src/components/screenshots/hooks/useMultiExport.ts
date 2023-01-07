import { open } from "@tauri-apps/api/dialog"
import { useRecoilCallback } from "recoil"
import {
  SingleScreenshotSelectorFamily,
  VideoJSONSelectorFamily,
} from "../../../recoil/screenshots/selectors"
import { Screenshot } from "../../../types"
import { invokeSaveFile } from "../../../utils/invokes"
import { useUpscaler } from "./useUpscaler"

export const useMultiExport = () => {
  const upscaler = useUpscaler()

  return useRecoilCallback(
    ({ snapshot }) =>
      async (fileNames: string[]) => {
        const screenshots = (await Promise.all(
          fileNames.map((fileName) =>
            snapshot.getPromise(SingleScreenshotSelectorFamily(fileName))
          )
        )) as Screenshot[]

        const screenshotsUpscaled = await Promise.all(
          screenshots.map(async (screenshot) => {
            const objUrl = URL.createObjectURL(screenshot.file)
            const image = new Image()
            image.src = objUrl

            await new Promise((resolve) => (image.onload = resolve))
            const videoJson = await snapshot.getPromise(
              VideoJSONSelectorFamily(`${screenshot.author}.${screenshot.core}`)
            )
            const url = upscaler(videoJson, image)
            const file = await fetch(url)
              .then((res) => res.arrayBuffer())
              .then(
                (buf) =>
                  new File([buf], screenshot.file_name, { type: "image/png" })
              )
            return { ...screenshot, upscaledFile: file }
          })
        )

        const saveDir = await open({
          title: "Save Screenshots",
          directory: true,
          multiple: false,
        })

        if (!saveDir) return

        await Promise.all(
          screenshotsUpscaled.map(async ({ game, file_name, upscaledFile }) => {
            const buffer = await upscaledFile.arrayBuffer()
            const filePath = `${saveDir}/${game
              .replace(/\.[A-z]*$/, "")
              .replace(/\s/g, "_")
              .toLowerCase()
              .substring(0, 60)}_${file_name}`
            await invokeSaveFile(filePath, new Uint8Array(buffer))
          })
        )
      },
    []
  )
}
