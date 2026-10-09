import { useEffect, useState } from "react"
import { CanvasTexture, SRGBColorSpace } from "three"
import { useAtomValue } from "jotai"
import { PlatformImageSelectorFamily } from "../../jotai/platforms/selectors"
import { CoreMainPlatformIdSelectorFamily } from "../../jotai/selectors"

export const CoreLogoScreen = ({ coreName }: { coreName: string }) => {
  const platformId = useAtomValue(CoreMainPlatformIdSelectorFamily(coreName))
  const platformImage = useAtomValue(PlatformImageSelectorFamily(platformId))
  const [screenTexture, setScreenTexture] = useState<CanvasTexture | null>(null)

  console.log({ coreName })

  useEffect(() => {
    if (!platformImage) return

    let isCancelled = false
    const image = new Image()

    image.onload = () => {
      if (isCancelled) return

      const canvas = document.createElement("canvas")
      const scale = 5
      canvas.width = 160 * scale
      canvas.height = 144 * scale
      const context = canvas.getContext("2d")
      if (!context) return

      context.fillStyle = "#222"
      context.fillRect(0, 0, canvas.width, canvas.height)
      const imageScale = canvas.width / image.width
      context.drawImage(
        image,
        0,
        canvas.height / 2 - (image.height * imageScale) / 2,
        image.width * imageScale,
        image.height * imageScale
      )

      context.fillStyle = "white"
      context.textAlign = "center"
      let fontSize = 32
      do {
        fontSize -= 1
        context.font = `${fontSize * scale}px GamePocket`
      } while (context.measureText(coreName).width > canvas.width * 0.9)

      context.fillText(coreName, canvas.width / 2, canvas.height - 16 * scale)

      const newTexture = new CanvasTexture(canvas)
      newTexture.anisotropy = 16
      newTexture.colorSpace = SRGBColorSpace

      setScreenTexture((prevTexture) => {
        if (prevTexture) prevTexture.dispose()
        return newTexture
      })
    }

    image.src = platformImage
    return () => {
      isCancelled = true
    }
  }, [coreName, platformImage])

  useEffect(() => {
    return () => {
      if (screenTexture) screenTexture.dispose()
    }
  }, [screenTexture])

  return (
    <meshPhysicalMaterial
      attach="material"
      map={screenTexture || undefined}
      emissive={"white"}
      emissiveMap={screenTexture || undefined}
      clearcoat={1}
      envMapIntensity={0.01}
    />
  )
}
