import { Suspense, useCallback, useEffect, useState } from "react"
import { useRecoilState, useRecoilValue } from "recoil"
import {
  ImageDimensionsSelectorFamily,
  SingleScreenshotSelectorFamily,
} from "../../recoil/screenshots/selectors"
import { VideoJSONSelectorFamily } from "../../recoil/screenshots/selectors"
import "./info.css"

import { useSaveFile } from "../../hooks/saveFile"
import { Controls } from "../controls"
import { CoreTag } from "../shared/coreTag"
import { Loader } from "../loader"
import { useUpscaler } from "./hooks/useUpscaler"
import { useTranslation } from "react-i18next"
import { ControlsBackButton } from "../controls/inputs/backButton"
import { ControlsButton } from "../controls/inputs/button"
import { ControlsCheckbox } from "../controls/inputs/checkbox"
import { imageModeAtom } from "../../recoil/screenshots/atom"

type ScreenshotInfoProps = {
  fileName: string
  onBack: () => void
}

export const ScreenshotInfo = ({ fileName, onBack }: ScreenshotInfoProps) => {
  const [imageMode, setImageMode] = useRecoilState(imageModeAtom)
  const screenshot = useRecoilValue(SingleScreenshotSelectorFamily(fileName))
  if (screenshot === null) throw new Error(`Null file ${fileName}`)
  const videoJson = useRecoilValue(
    VideoJSONSelectorFamily(`${screenshot.author}.${screenshot.core}`)
  )
  const upscaler = useUpscaler()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const { t } = useTranslation("screenshot_info")

  useEffect(() => {
    let cancelled = false
    switch (imageMode) {
      case "raw":
        setImageSrc(URL.createObjectURL(screenshot.file))
        break
      case "upscaled":
        {
          const image = new Image()
          image.src = URL.createObjectURL(screenshot.file)
          image.onload = () => {
            if (cancelled) return
            setImageSrc(upscaler(videoJson, image))
          }
        }
        break
    }

    return () => {
      cancelled = true
    }
  }, [screenshot.file, imageMode, upscaler, videoJson])

  const saveFile = useSaveFile()

  const openShareSheet = useCallback(async () => {
    if (!imageSrc) return
    const file = await fetch(imageSrc)
      .then((res) => res.arrayBuffer())
      .then(
        (buf) => new File([buf], screenshot.file_name, { type: "image/png" })
      )

    navigator.share({ files: [file] })
  }, [imageSrc, screenshot.file_name])

  return (
    <div className="screenshot-info">
      <Controls>
        <ControlsBackButton onClick={onBack}>
          {t("controls.back")}
        </ControlsBackButton>
        <ControlsButton
          onClick={() => {
            if (!imageSrc) return
            saveFile(screenshot.file_name, imageSrc)
          }}
        >
          {t("controls.save")}
        </ControlsButton>
        <ControlsButton onClick={openShareSheet}>
          {t("controls.share")}
        </ControlsButton>
        <ControlsCheckbox
          checked={imageMode === "upscaled"}
          onChange={(checked) =>
            checked ? setImageMode("upscaled") : setImageMode("raw")
          }
        >
          {t("controls.upscaled")}
        </ControlsCheckbox>
      </Controls>
      <img
        className="screenshot-info__raw-image"
        src={imageSrc || undefined}
      ></img>

      <div className="screenshot-info__info">
        <div className="screenshot-info__name">
          {screenshot.game}
          {imageSrc && (
            <Suspense>
              <ImageDimensions imageSrc={imageSrc} />
            </Suspense>
          )}
        </div>
        {screenshot.platform && <div>{screenshot.platform}</div>}
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

const ImageDimensions = ({ imageSrc }: { imageSrc: string }) => {
  const size = useRecoilValue(ImageDimensionsSelectorFamily(imageSrc))
  return (
    // eslint-disable-next-line react/jsx-no-literals
    <span className="screenshot-info__dimensions">{`(${size.width}px x ${size.height}px)`}</span>
  )
}
