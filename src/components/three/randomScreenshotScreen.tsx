import { useEffect, useMemo, useRef, useState } from "react"
import { useRecoilValue } from "recoil"
import {
  screenshotsListSelector,
  SingleScreenshotImageSelectorFamily,
} from "../../recoil/screenshots/selectors"
import { MeshPhysicalMaterial, SRGBColorSpace, Texture } from "three"
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
  const materialRef = useRef<MeshPhysicalMaterial | null>(null)
  const image = useRecoilValue(SingleScreenshotImageSelectorFamily(name))

  useEffect(() => {
    if (!image || !materialRef.current) return

    const newTexture = new Texture(image)
    newTexture.needsUpdate = true
    // newTexture.minFilter = LinearFilter
    // newTexture.magFilter = NearestFilter
    newTexture.colorSpace = SRGBColorSpace

    materialRef.current.map?.dispose()
    materialRef.current.map = newTexture
    materialRef.current.emissiveMap = newTexture
    materialRef.current.needsUpdate = true
  }, [image])

  return (
    <meshPhysicalMaterial
      ref={materialRef}
      attach="material"
      clearcoat={1}
      clearcoatRoughness={0}
      envMapIntensity={0.01}
      reflectivity={0}
      emissive={"white"}
      emissiveIntensity={0.5}
    />
  )
}
