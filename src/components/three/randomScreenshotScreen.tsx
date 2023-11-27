import { useEffect, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import {
  screenshotsListSelector,
  SingleScreenshotImageSelectorFamily,
} from "../../recoil/screenshots/selectors"
import { LinearFilter, NearestFilter, Texture } from "three"
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
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const image = useRecoilValue(SingleScreenshotImageSelectorFamily(name))

  useEffect(() => {
    ;(async () => {
      if (!image) return

      const newTexture = new Texture()
      newTexture.image = image
      newTexture.needsUpdate = true
      newTexture.minFilter = LinearFilter
      newTexture.magFilter = NearestFilter
      setTexture(newTexture)
    })()
  }, [image])

  return (
    <meshBasicMaterial
      attach="material"
      map={texture || undefined}
    ></meshBasicMaterial>
  )
}
