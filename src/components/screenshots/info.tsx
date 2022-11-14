import React, { useCallback, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import {
  SingleScreenshotSelectorFamily,
  VideoJSONSelectorFamily,
} from "../../recoil/selectors"
import "./info.css"

import { useSaveFile } from "../../hooks/saveFile"
import { Controls } from "../controls"

type ScreenshotInfo = {
  fileName: string
  onBack: () => void
}

const POCKET_WIDTH = 1600
const POCKET_HEIGHT = 1440

export const ScreenshotInfo = ({ fileName, onBack }: ScreenshotInfo) => {
  const [imageMode, setImageMode] = useState<"raw" | "upscaled">("upscaled")
  const screenshot = useRecoilValue(SingleScreenshotSelectorFamily(fileName))
  if (screenshot === null) throw new Error(`Null file ${fileName}`)

  const videoJson = useRecoilValue(
    VideoJSONSelectorFamily({
      authorName: screenshot.author,
      coreName: screenshot.core,
    })
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

  const saveFile = useSaveFile()

  const openShareSheet = useCallback(async () => {
    const file = await fetch(imageSrc)
      .then((res) => res.arrayBuffer())
      .then(
        (buf) => new File([buf], screenshot.file_name, { type: "image/png" })
      )

    navigator.share({ files: [file] })
  }, [imageSrc])

  return (
    <div className="screenshot-info">
      <Controls
        controls={[
          {
            type: "back-button",
            text: "Back to list",
            onClick: onBack,
          },
          {
            type: "button",
            text: "Save",
            onClick: () => saveFile(screenshot.file_name, imageSrc),
          },
          { type: "button", text: "Share", onClick: openShareSheet },
          {
            type: "checkbox",
            text: "Upscaled",
            checked: imageMode === "upscaled",
            onChange: (checked) =>
              checked ? setImageMode("upscaled") : setImageMode("raw"),
          },
        ]}
      />
      <img className="screenshot-info__raw-image" src={imageSrc}></img>

      <div className="screenshot-info__info">
        <div>{screenshot.game}</div>
        <div>{screenshot.platform}</div>
        <div>{screenshot.file_name}</div>
      </div>
    </div>
  )
}
