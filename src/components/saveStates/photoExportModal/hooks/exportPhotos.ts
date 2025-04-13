import { open } from "@tauri-apps/plugin-dialog"

import { PhotoExportImageSelectorFamily } from "../../../../recoil/saveStates/selectors"
import { invokeSaveFile } from "../../../../utils/invokes"
import { open as openFolder } from "@tauri-apps/plugin-shell"
import { useAtomCallback } from "jotai/utils"
import { useCallback } from "react"

export const useExportPhotos = () => {
  return useAtomCallback(
    useCallback(async (get, _set, path: string, selectedIndex?: number) => {
      const saveDir = await open({
        title: "Save Photos",
        directory: true,
        multiple: false,
      })

      if (!saveDir) return

      const imageSrcs =
        selectedIndex === undefined
          ? await Promise.all(
              new Array(30)
                .fill(null)
                .map((_, index) =>
                  get(PhotoExportImageSelectorFamily({ path, index }))
                )
            )
          : [
              await get(
                PhotoExportImageSelectorFamily({ path, index: selectedIndex })
              ),
            ]

      const files = await Promise.all(
        imageSrcs.map(
          async (src, index) =>
            await fetch(src)
              .then((res) => res.arrayBuffer())
              .then(
                (buf) =>
                  new File([buf], `GB_CAMERA_${selectedIndex || index}.png`, {
                    type: "image/png",
                  })
              )
        )
      )

      await Promise.all(
        files.map(async (file) => {
          const buffer = await file.arrayBuffer()
          const filePath = `${saveDir}/${file.name}`
          await invokeSaveFile(filePath, new Uint8Array(buffer))
        })
      )

      openFolder(saveDir as string)
    }, [])
  )
}
