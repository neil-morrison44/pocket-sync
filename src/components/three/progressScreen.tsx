import { useEffect, useRef } from "react"
import {
  CanvasTexture,
  MeshPhysicalMaterial,
  NearestFilter,
  SRGBColorSpace,
} from "three"

type ProgressScreenProps = {
  value: number
  max: number
  message?: string | null
}

const SCALE = 4

const DARKEST_GREEN = "#0f380f"
const DARK_GREEN = "#306230"
const LIGHT_GREEN = "#8bac0f"
const LIGHTEST_GREEN = "#9bbc0f"

export const ProgressScreen = ({
  value = 33,
  max = 100,
  message,
}: ProgressScreenProps) => {
  const materialRef = useRef<MeshPhysicalMaterial | null>(null)
  const textureRef = useRef<CanvasTexture | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  // Create the persistent canvas + CanvasTexture once and wire it into the material.
  useEffect(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 160 * SCALE
    canvas.height = 140 * SCALE

    const context = canvas.getContext("2d")
    if (!context) return

    const texture = new CanvasTexture(canvas)
    texture.anisotropy = 4
    texture.minFilter = NearestFilter
    texture.magFilter = NearestFilter
    texture.colorSpace = SRGBColorSpace

    textureRef.current = texture
    contextRef.current = context

    if (materialRef.current) {
      materialRef.current.map = texture
      materialRef.current.emissiveMap = texture
      materialRef.current.needsUpdate = true
    }

    return () => {
      texture.dispose()
    }
  }, [])

  // Redraw the persistent canvas on prop change, then flag the texture for re-upload.
  useEffect(() => {
    const context = contextRef.current
    if (!context) return

    const canvas = context.canvas

    context.fillStyle = DARKEST_GREEN
    context.fillRect(0, 0, canvas.width, canvas.height)

    context.fillStyle = DARK_GREEN
    context.fillRect(0, 0, canvas.width * (value / max), canvas.height)

    context.fillStyle = LIGHTEST_GREEN
    context.font = `${70 * SCALE}px GamePocket`
    const text = `${((value / max) * 100).toFixed(0)}%`
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(text, canvas.width / 2, canvas.height / 2)

    if (message) {
      let fontSize = 40
      do {
        context.font = `${fontSize * SCALE}px GamePocket`
        fontSize--
      } while (context.measureText(message).width > canvas.width * 0.8)
      context.fillStyle = LIGHT_GREEN
      context.fillText(message, canvas.width / 2, canvas.height * 0.9)
    }

    if (textureRef.current) textureRef.current.needsUpdate = true
  }, [value, max, message])

  return (
    <meshPhysicalMaterial
      attach="material"
      ref={materialRef}
      clearcoat={1}
      clearcoatRoughness={0}
      envMapIntensity={0.01}
      emissive={"white"}
    />
  )
}
