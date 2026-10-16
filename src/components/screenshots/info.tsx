import { Suspense, useCallback, useEffect, useState } from "react"
import {
  ImageDimensionsSelectorFamily,
  SingleScreenshotSelectorFamily,
} from "../../jotai/screenshots/selectors"
import { VideoJSONSelectorFamily } from "../../jotai/screenshots/selectors"
import "./info.css"

import { useSaveFile } from "../../hooks/saveFile"
import { Controls, ControlsActions } from "../controls"
import { Link } from "../link"
import { useOpenGame } from "../../hooks/useOpenGame"
import { gameDisplayName } from "../../utils/gameName"
import { currentViewAtom } from "../../jotai/view/atoms"
import { useUpscaler } from "./hooks/useUpscaler"
import { useTranslation } from "react-i18next"
import { ControlsBackButton } from "../controls/inputs/backButton"
import { ControlsButton } from "../controls/inputs/button"
import { ControlsCheckbox } from "../controls/inputs/checkbox"
import { imageModeAtom } from "../../jotai/screenshots/atom"
import { useAtom, useAtomValue, useSetAtom } from "jotai"

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
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const { t } = useTranslation("screenshot_info")
  const { t: tScreenshots } = useTranslation("screenshots")
  const viewCore = useSetAtom(currentViewAtom)
  const openGame = useOpenGame()

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
        <ControlsCheckbox
          checked={imageMode === "upscaled"}
          onChange={(checked) =>
            checked ? setImageMode("upscaled") : setImageMode("raw")
          }
        >
          {t("controls.upscaled")}
        </ControlsCheckbox>
        <ControlsActions>
          <ControlsButton
            icon="save"
            onClick={() => {
              if (!imageSrc) return
              saveFile(screenshot.file_name, imageSrc)
            }}
          >
            {t("controls.save")}
          </ControlsButton>
          <ControlsButton icon="share" onClick={openShareSheet}>
            {t("controls.share")}
          </ControlsButton>
        </ControlsActions>
      </Controls>
      <div className="screenshot-info__image-area">
        <img
          className="screenshot-info__image"
          src={imageSrc || undefined}
          alt={screenshot.game}
        />
      </div>

      {/* Game and date first; where it's from and the file below, soft */}
      <footer className="screenshot-info__info">
        <div className="screenshot-info__title-row">
          <h2 className="screenshot-info__title">
            {/* Opens Games searched for it, until games have own pages */}
            {screenshot.game ? (
              <Link subtle onClick={() => openGame(screenshot.game)}>
                {gameDisplayName(screenshot.game)}
              </Link>
            ) : (
              screenshot.file_name
            )}
          </h2>
          {screenshot.timestamp && (
            <span className="screenshot-info__date">
              {tScreenshots("taken", { date: screenshot.timestamp })}
            </span>
          )}
        </div>
        <div className="screenshot-info__meta">
          {screenshot.platform && <span>{screenshot.platform}</span>}
          {screenshot.core && screenshot.author && (
            <Link
              onClick={() =>
                viewCore({
                  view: "Cores",
                  selected: `${screenshot.author}.${screenshot.core}`,
                })
              }
            >
              {`${screenshot.author}.${screenshot.core}`}
            </Link>
          )}
          {imageSrc && (
            <Suspense>
              <ImageDimensions imageSrc={imageSrc} />
            </Suspense>
          )}
          <span className="screenshot-info__file-name">
            {screenshot.file_name}
          </span>
        </div>
      </footer>
    </div>
  )
}

const ImageDimensions = ({ imageSrc }: { imageSrc: string }) => {
  const size = useAtomValue(ImageDimensionsSelectorFamily(imageSrc))
  const { t } = useTranslation("screenshot_info")
  return <span>{t("dimensions", size)}</span>
}
