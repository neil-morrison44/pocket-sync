import React, { Suspense, useCallback, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { SingleScreenshotSelectorFamily } from "../../recoil/screenshots/selectors"
import { VideoJSONSelectorFamily } from "../../recoil/screenshots/selectors"
import "./info.css"

import { useSaveFile } from "../../hooks/saveFile"
import { Controls } from "../controls"
import { CoreTag } from "../shared/coreTag"
import { Loader } from "../loader"
import { useUpscaler } from "./hooks/useUpscaler"

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
    VideoJSONSelectorFamily(`${screenshot.author}.${screenshot.core}`)
  )

  const image = useMemo(() => {
    const image = new Image()
    image.src = URL.createObjectURL(screenshot.file)
    image.onload = () => setImageLoaded(true)
    return image
  }, [screenshot.file])

  const [imageLoaded, setImageLoaded] = useState(false)

  const upscaler = useUpscaler()

  const imageSrc = useMemo(() => {
    switch (imageMode) {
      case "raw":
        return URL.createObjectURL(screenshot.file)
      case "upscaled":
        return upscaler(videoJson, image)
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
        {screenshot.platform && <div>{`Platform: ${screenshot.platform}`}</div>}
        {screenshot.core && screenshot.author && (
          <Suspense fallback={<Loader />}>
            <CoreTag coreName={`${screenshot.author}.${screenshot.core}`} />
          </Suspense>
        )}
        <div>{screenshot.file_name}</div>
      </div>
    </div>
  )
}
