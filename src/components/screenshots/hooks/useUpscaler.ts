import { useCallback } from "react"
import { VideoJSON } from "../../../types"

const POCKET_WIDTH = 1600
const POCKET_HEIGHT = 1440

export const useUpscaler = () => {
  return useCallback((videoJson: VideoJSON, image: HTMLImageElement) => {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")

    if (!context) throw new Error("Unable to get canvas context")

    const scalarMode = videoJson.video.scaler_modes.find(
      ({ width, height }) => width === image.width && height === image.height
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
  }, [])
}
