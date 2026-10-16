import { useEffect, useMemo, useRef, useState } from "react"

import {
  screenshotsListSelector,
  SingleScreenshotImageSelectorFamily,
  SingleScreenshotSelectorFamily,
  VideoJSONSelectorFamily,
} from "../../jotai/screenshots/selectors"
import { CanvasTexture, MeshPhysicalMaterial, SRGBColorSpace } from "three"
import { VideoJSON } from "../../types"
import { StaticScreen } from "./staticScreen"
import { useAtomValue } from "jotai"

type RandomScreenshotScreenProps = {
  interval?: number
}

export const RandomScreenshotScreen = ({
  interval = 3000,
}: RandomScreenshotScreenProps) => {
  const screenshotList = useAtomValue(screenshotsListSelector)
  const [screenshotIndex, setScreenshotIndex] = useState(0)

  const screenshotName = useMemo(
    () => screenshotList[screenshotIndex],
    [screenshotList, screenshotIndex]
  )

  useEffect(() => {
    const changeImageInterval = setInterval(
      () =>
        setScreenshotIndex(Math.floor(Math.random() * screenshotList.length)),
      interval
    )
    return () => {
      clearInterval(changeImageInterval)
    }
  })

  if (screenshotList.length === 0) return <StaticScreen mode="GAMEBOY" />
  return <ScreenshotScreen key={screenshotName} name={screenshotName} />
}

/** The Pocket's screen: 1600 × 1440, at half size for the texture. */
const SCREEN_WIDTH = 800
const SCREEN_HEIGHT = 720

/**
 * Draws the screenshot like the Pocket shows it: at the core's display
 * aspect ratio (from its video.json scaler mode, else the image's own),
 * as large as fits, with black bars around it, never stretched.
 */
const frameScreenshot = (image: HTMLImageElement, videoJson: VideoJSON) => {
  const canvas = document.createElement("canvas")
  canvas.width = SCREEN_WIDTH
  canvas.height = SCREEN_HEIGHT
  const context = canvas.getContext("2d")
  if (!context) return canvas

  const scalerMode = videoJson.video.scaler_modes.find(
    ({ width, height }) => width === image.width && height === image.height
  )
  const aspect = scalerMode
    ? scalerMode.aspect_w / scalerMode.aspect_h
    : image.width / image.height

  const width = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT * aspect)
  const height = width / aspect

  context.fillStyle = "black"
  context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
  context.imageSmoothingEnabled = false
  context.drawImage(
    image,
    (SCREEN_WIDTH - width) / 2,
    (SCREEN_HEIGHT - height) / 2,
    width,
    height
  )
  return canvas
}

const ScreenshotScreen = ({ name }: { name: string }) => {
  const materialRef = useRef<MeshPhysicalMaterial | null>(null)
  const image = useAtomValue(SingleScreenshotImageSelectorFamily(name))
  const screenshot = useAtomValue(SingleScreenshotSelectorFamily(name))
  const videoJson = useAtomValue(
    VideoJSONSelectorFamily(`${screenshot?.author}.${screenshot?.core}`)
  )

  useEffect(() => {
    if (!image || !materialRef.current) return

    const newTexture = new CanvasTexture(frameScreenshot(image, videoJson))
    newTexture.needsUpdate = true
    newTexture.colorSpace = SRGBColorSpace

    materialRef.current.map?.dispose()
    materialRef.current.map = newTexture
    materialRef.current.emissiveMap = newTexture
    materialRef.current.needsUpdate = true
  }, [image, videoJson])

  return (
    <meshPhysicalMaterial
      ref={materialRef}
      attach="material"
      clearcoat={0.5}
      clearcoatRoughness={0.55}
      envMapIntensity={0.01}
      reflectivity={0}
      emissive={"white"}
      emissiveIntensity={0.5}
    />
  )
}
