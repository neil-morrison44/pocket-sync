import { open } from "@tauri-apps/plugin-dialog"

import {
  SingleScreenshotSelectorFamily,
  VideoJSONSelectorFamily,
} from "../../../recoil/screenshots/selectors"
import { Screenshot } from "../../../types"
import { invokeSaveFile } from "../../../utils/invokes"
import { useUpscaler } from "./useUpscaler"
import { imageModeAtom } from "../../../recoil/screenshots/atom"
import { useAtomCallback } from "jotai/utils"
import { useCallback } from "react"

export const useMultiExport = () => {
  const upscaler = useUpscaler()

  return useAtomCallback(
    useCallback(async (get, _set, fileNames: string[]) => {
      const screenshots = (await Promise.all(
        fileNames.map((fileName) =>
          get(SingleScreenshotSelectorFamily(fileName))
        )
      )) as Screenshot[]

      const imageMode = await get(imageModeAtom)

      const processedScreenshots = await Promise.all(
        screenshots.map(async (screenshot) => {
          const objUrl = URL.createObjectURL(screenshot.file)
          const image = new Image()
          image.src = objUrl

          await new Promise((resolve) => (image.onload = resolve))
          const videoJson = await get(
            VideoJSONSelectorFamily(`${screenshot.author}.${screenshot.core}`)
          )
          const url = upscaler(videoJson, image, imageMode === "raw")
          const file = await fetch(url)
            .then((res) => res.arrayBuffer())
            .then(
              (buf) =>
                new File([buf], screenshot.file_name, { type: "image/png" })
            )
          return { ...screenshot, processedFile: file }
        })
      )

      const saveDir = await open({
        title: "Save Screenshots",
        directory: true,
        multiple: false,
      })

      if (!saveDir) return

      await Promise.all(
        processedScreenshots.map(async ({ game, file_name, processedFile }) => {
          const buffer = await processedFile.arrayBuffer()
          const filePath = `${saveDir}/${game
            .replace(/\.[A-z]*$/, "")
            .replace(/\s/g, "_")
            .toLowerCase()
            .substring(0, 60)}_${file_name}`
          await invokeSaveFile(filePath, new Uint8Array(buffer))
        })
      )
    }, [])
  )
}
