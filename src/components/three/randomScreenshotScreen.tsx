import React, { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useRecoilCallback, useRecoilValue } from "recoil"
import {
  screenshotsListSelector,
  SingleScreenshotSelectorFamily,
} from "../../recoil/selectors"
import { useLoader } from "@react-three/fiber"
import { TextureLoader, Texture } from "three"
import { useScreenshot } from "../screenshots/hooks/useScreenshot"

type RandomScreenshotScreenProps = {
  interval?: number
}

export const RandomScreenshotScreen = ({
  interval = 2000,
}: RandomScreenshotScreenProps) => {
  const screenshotList = useRecoilValue(screenshotsListSelector)
  const [randomNudge, setRandomNudge] = useState(0)

  const screenshotName = useMemo(() => {
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

  if (screenshotList.length === 0)
    return <meshPhongMaterial attach="material" color="green" />

  return (
    <Suspense fallback={<meshPhongMaterial attach="material" color="green" />}>
      <ScreenshotScreen name={screenshotName} />
    </Suspense>
  )
}

const ScreenshotScreen = ({ name }: { name: string }) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  const loadImageFile = useRecoilCallback(
    ({ snapshot }) =>
      async (imageName: string) => {
        const screenshot = await snapshot.getPromise(
          SingleScreenshotSelectorFamily(imageName)
        )
        if (!screenshot) return
        const image = new Image()
        image.src = URL.createObjectURL(screenshot.file)
        return image
      }
  )

  useEffect(() => {
    ;(async () => {
      const image = await loadImageFile(name)
      if (!image) return
      image.onload = () => {
        const newTexture = new Texture()
        newTexture.image = image
        newTexture.needsUpdate = true
        newTexture.anisotropy = 4
        setTexture(newTexture)
      }
    })()
  }, [name])

  return (
    <meshBasicMaterial
      attach="material"
      map={texture || undefined}
    ></meshBasicMaterial>
  )
}
