import { Suspense, use, useCallback, useEffect, useMemo, useState } from "react"
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
import { useAtom, useAtomValue } from "jotai"
import { ViewTransition } from "react"

type ScreenshotInfoProps = {
  fileName: string
  onBack: () => void
}

export const ScreenshotInfo = ({ fileName, onBack }: ScreenshotInfoProps) => {
  const [imageMode, setImageMode] = useAtom(imageModeAtom)
  const screenshot = useAtomValue(SingleScreenshotSelectorFamily(fileName))
  if (screenshot === null) throw new Error(`Null file ${fileName}`)
  const videoJson = useAtomValue(
    VideoJSONSelectorFamily(`${screenshot.author}.${screenshot.core}`)
  )
  const upscaler = useUpscaler()
  // const [imageSrc, setImageSrc] = useState<string | null>(null)
  const { t } = useTranslation("screenshot_info")
  const image = use(imagePromiser(screenshot.file))

  const imageSrc = useMemo(() => {
    switch (imageMode) {
      case "raw":
        return image.src
      case "upscaled":
        return upscaler(videoJson, image)
    }
  }, [imageMode, screenshot])

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
      <ViewTransition
        name={"a" + fileName.replace(".png", "").replace("_", "")}
      >
        <img
          className="screenshot-info__raw-image"
          src={imageSrc || undefined}
        ></img>
      </ViewTransition>

      <div className="screenshot-info__info">
        <div className="screenshot-info__name">
          {screenshot.game}
          {imageSrc && <ImageDimensions imageSrc={imageSrc} />}
        </div>
        {screenshot.platform && <div>{screenshot.platform}</div>}
        {screenshot.core && screenshot.author && (
          <CoreTag coreName={`${screenshot.author}.${screenshot.core}`} />
        )}
        <div>{screenshot.file_name}</div>
      </div>
    </div>
  )
}

const ImageDimensions = ({ imageSrc }: { imageSrc: string }) => {
  const size = useAtomValue(ImageDimensionsSelectorFamily(imageSrc))
  return (
    // eslint-disable-next-line react/jsx-no-literals
    <span className="screenshot-info__dimensions">{`(${size.width}px x ${size.height}px)`}</span>
  )
}

const ImagePromiseWeakMap = new WeakMap<File, Promise<HTMLImageElement>>()
const imagePromiser = (file: File) => {
  const priorPromise = ImagePromiseWeakMap.get(file)
  if (priorPromise) return priorPromise

  const blobUrl = URL.createObjectURL(file)
  const image = new Image()
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    image.addEventListener("load", () => resolve(image))
  })
  image.src = blobUrl
  ImagePromiseWeakMap.set(file, promise)
  return promise
}
