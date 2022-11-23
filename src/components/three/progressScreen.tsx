import React, { useEffect, useState } from "react"
import { NearestFilter, Texture } from "three"

type ProgressScreenProps = {
  value: number
  max: number
}

const SCALE = 4

const DARKEST_GREEN = "#0f380f"
const DARK_GREEN = "#306230"
const LIGHT_GREEN = "#8bac0f"
const LIGHTEST_GREEN = "#9bbc0f"

export const ProgressScreen = ({
  value = 33,
  max = 100,
}: ProgressScreenProps) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 160 * SCALE
    canvas.height = 140 * SCALE

    const context = canvas.getContext("2d")
    if (!context) return

    context.fillStyle = DARKEST_GREEN
    context.fillRect(0, 0, canvas.width, canvas.height)

    context.fillStyle = DARK_GREEN
    context.fillRect(0, 0, canvas.width * (value / max), canvas.height)

    context.fillStyle = LIGHTEST_GREEN
    context.font = `${85 * SCALE}px Analogue`
    const text = `${((value / max) * 100).toFixed(0)}%`
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(text, canvas.width / 2, canvas.height / 2)

    canvas.toBlob((b) => {
      if (!b) return
      const image = new Image()
      image.src = URL.createObjectURL(b)
      image.onload = () => {
        const newTexture = new Texture()
        newTexture.image = image
        newTexture.needsUpdate = true
        newTexture.anisotropy = 4
        newTexture.minFilter = NearestFilter
        newTexture.magFilter = NearestFilter
        setTexture(newTexture)
      }
    })
  }, [value, max])

  return (
    <meshBasicMaterial
      attach="material"
      map={texture || undefined}
    ></meshBasicMaterial>
  )
}
