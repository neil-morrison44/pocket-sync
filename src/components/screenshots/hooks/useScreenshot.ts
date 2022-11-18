import { useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import {
  SingleScreenshotSelectorFamily,
  VideoJSONSelectorFamily,
} from "../../../recoil/selectors"

const POCKET_WIDTH = 1600
const POCKET_HEIGHT = 1440

export const useScreenshot = (
  imageMode: "raw" | "upscaled",
  fileName: string
) => {
  const screenshot = useRecoilValue(SingleScreenshotSelectorFamily(fileName))
  if (screenshot === null) throw new Error(`Null file ${fileName}`)

  const videoJson = useRecoilValue(
    VideoJSONSelectorFamily(`${screenshot.author}.${screenshot.core}`)
  )

  const image = useMemo(() => {
    const image = new Image()
    image.src = URL.createObjectURL(screenshot.file)
    image.onload = () => setImageLoaded(true)
    return image
  }, [screenshot.file])

  const [imageLoaded, setImageLoaded] = useState(false)

  const imageSrc = useMemo(() => {
    switch (imageMode) {
      case "raw":
        return URL.createObjectURL(screenshot.file)
      case "upscaled":
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")

        if (!context) throw new Error("Unable to get canvas context")

        const scalarMode = videoJson.video.scaler_modes.find(
          ({ width, height }) =>
            width === image.width && height === image.height
        )

        if (scalarMode) {
          if (scalarMode.aspect_h > scalarMode.aspect_w) {
            canvas.height = POCKET_HEIGHT
            canvas.width =
              POCKET_HEIGHT * (scalarMode.aspect_w / scalarMode.aspect_h)
          } else {
            canvas.width = POCKET_WIDTH
            canvas.height =
              POCKET_WIDTH * (scalarMode.aspect_h / scalarMode.aspect_w)
          }
        } else {
          canvas.height = image.height * 10
          canvas.width = image.width * 10
        }

        context.imageSmoothingEnabled = false
        context?.drawImage(image, 0, 0, canvas.width, canvas.height)

        return canvas.toDataURL()
    }
  }, [imageMode, imageLoaded])

  return imageSrc
}
