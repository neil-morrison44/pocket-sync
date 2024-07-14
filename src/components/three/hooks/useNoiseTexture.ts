import { useTexture } from "@react-three/drei"
import { useMemo } from "react"
import { RepeatWrapping, Texture, Vector2 } from "three"

import { createNoise4D } from "simplex-noise"

type NoiseTextureArgs = {
  size: number
  min: number
  max: number
  pixelModFunc?: (rgb: [number, number, number]) => [number, number, number]
}
const NOISE_CACHE: Record<string, string> = {}

const generateNoise = (args: NoiseTextureArgs): string => {
  const cacheKey = JSON.stringify(args)

  if (NOISE_CACHE[cacheKey]) return NOISE_CACHE[cacheKey]

  const { size, min, max, pixelModFunc } = args
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size

  const context = canvas.getContext("2d")

  if (!context) throw new Error("failed to get canvas context")
  context.fillStyle = "black"
  context.fillRect(0, 0, size, size)

  const imageData = context.createImageData(size, size)

  const noise4D = createNoise4D()

  const scale = size * size

  for (let index = 0; index < imageData.data.length; index += 4) {
    const pixelIndex = index / 4
    const x = pixelIndex % size
    const y = Math.floor(pixelIndex / size)

    const s = x / scale
    const t = y / scale

    const radius = size * (2 * Math.PI) // Adjust the radius for correct tiling

    // Convert (x, y) to (s, t) for seamless tiling
    const nx = radius * Math.cos(2 * Math.PI * s)
    const ny = radius * Math.sin(2 * Math.PI * s)
    const nz = radius * Math.cos(2 * Math.PI * t)
    const nw = radius * Math.sin(2 * Math.PI * t)

    // const shade = (noise4D(x, y, 0, 0) + 1) / 2
    const shade = (noise4D(nx, ny, nz, nw) + 1) / 2
    const value = Math.round(min + shade * (max - min))
    const rgb = [value, value, value] as [number, number, number]

    const [r, g, b] = pixelModFunc ? pixelModFunc(rgb) : rgb

    // imageData.data[index] = x < 10 || y < 10 ? 255 : r
    imageData.data[index] = r
    imageData.data[index + 1] = g
    imageData.data[index + 2] = b
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
  pixelModFunc,
}: NoiseTextureArgs): Texture | null => {
  const imageUrl = useMemo(() => {
    return generateNoise({
      size,
      min,
      max,
      pixelModFunc,
    })
  }, [size, min, max])

  const texture = useTexture(imageUrl)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping

  texture.repeat = new Vector2(0.25, 0.25)

  return texture
}
