import { useEffect, useMemo, useRef, useState } from "react"
import { useRecoilValue } from "recoil"
import {
  screenshotsListSelector,
  SingleScaledScreenshotImageSelectorFamily,
} from "../../recoil/screenshots/selectors"
import { MeshBasicMaterial, SRGBColorSpace, Texture } from "three"
import { StaticScreen } from "./staticScreen"

type RandomScreenshotScreenProps = {
  interval?: number
}

export const RandomScreenshotScreen = ({
  interval = 3000,
}: RandomScreenshotScreenProps) => {
  const screenshotList = useRecoilValue(screenshotsListSelector)
  const [randomNudge, setRandomNudge] = useState(0)

  const screenshotName = useMemo(() => {
    randomNudge
    return screenshotList[Math.floor(Math.random() * screenshotList.length)]
  }, [screenshotList, randomNudge])

  useEffect(() => {
    const changeImageInterval = setInterval(
      () => setRandomNudge(Date.now()),
      interval
    )

    return () => {
      clearInterval(changeImageInterval)
    }
  })

  if (screenshotList.length === 0) return <StaticScreen mode="GAMEBOY" />
  return <ScreenshotScreen key={screenshotName} name={screenshotName} />
}

const ScreenshotScreen = ({ name }: { name: string }) => {
  const materialRef = useRef<MeshBasicMaterial | null>(null)
  const image = useRecoilValue(SingleScaledScreenshotImageSelectorFamily(name))

  useEffect(() => {
    if (!image || !materialRef.current) return

    const newTexture = new Texture(image)
    newTexture.needsUpdate = true
    // newTexture.minFilter = LinearFilter
    // newTexture.magFilter = NearestFilter
    newTexture.colorSpace = SRGBColorSpace

    materialRef.current.map?.dispose()
    materialRef.current.map = newTexture
    materialRef.current.needsUpdate = true
  }, [image])

  return (
    <meshBasicMaterial ref={materialRef} attach="material"></meshBasicMaterial>
  )
}
