import { useTexture } from "@react-three/drei"
import { useMemo } from "react"
import { RepeatWrapping, Texture } from "three"

type NoiseTextureArgs = {
  size: number
  min: number
  max: number
}
const NOISE_CACHE: Record<string, string> = {}

const generateNoise = (args: NoiseTextureArgs): string => {
  const cacheKey = JSON.stringify(args)

  if (NOISE_CACHE[cacheKey]) return NOISE_CACHE[cacheKey]

  const { size, min, max } = args
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size

  const context = canvas.getContext("2d")

  if (!context) throw new Error("failed to get canvas context")
  context.fillStyle = "black"
  context.fillRect(0, 0, size, size)

  const imageData = context.createImageData(size, size)

  for (let index = 0; index < imageData.data.length; index += 4) {
    imageData.data[index] = Math.round(min + Math.random() * (max - min))
    imageData.data[index + 1] = Math.round(min + Math.random() * (max - min))
    imageData.data[index + 2] = Math.round(min + Math.random() * (max - min))
    imageData.data[index + 3] = 255
  }

  context.putImageData(imageData, 0, 0)

  // context.fillStyle = "blue"
  // context.fillRect(size / 4, size / 4, size / 2, size / 2)

  const url = canvas.toDataURL()

  return (NOISE_CACHE[cacheKey] = url)
}

export const useNoiseTexture = ({
  size,
  min = 0,
  max = 255,
}: NoiseTextureArgs): Texture | null => {
  const imageUrl = useMemo(() => {
    return generateNoise({
      size,
      min,
      max,
    })
  }, [size, min, max])

  const texture = useTexture(imageUrl)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping

  return texture
}
