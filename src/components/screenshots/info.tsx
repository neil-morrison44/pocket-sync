import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
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

export const ScreenshotInfo = ({ fileName, onBack }: ScreenshotInfo) => {
  const [imageMode, setImageMode] = useState<"raw" | "upscaled">("upscaled")
  const screenshot = useRecoilValue(SingleScreenshotSelectorFamily(fileName))
  if (screenshot === null) throw new Error(`Null file ${fileName}`)
  const videoJson = useRecoilValue(
    VideoJSONSelectorFamily(`${screenshot.author}.${screenshot.core}`)
  )
  const upscaler = useUpscaler()
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    switch (imageMode) {
      case "raw":
        setImageSrc(URL.createObjectURL(screenshot.file))
        break
      case "upscaled":
        const image = new Image()
        image.src = URL.createObjectURL(screenshot.file)
        image.onload = () => {
          if (cancelled) return
          setImageSrc(upscaler(videoJson, image))
        }
        break
    }

    return () => {
      cancelled = true
    }
  }, [screenshot.file, imageMode])

  const saveFile = useSaveFile()

  const openShareSheet = useCallback(async () => {
    if (!imageSrc) return
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
            onClick: () => {
              if (!imageSrc) return
              saveFile(screenshot.file_name, imageSrc)
            },
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
      <img
        className="screenshot-info__raw-image"
        src={imageSrc || undefined}
      ></img>

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
