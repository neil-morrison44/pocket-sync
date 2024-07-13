import { useContext, useMemo } from "react"
import { Color, MeshPhysicalMaterial } from "three"
import { BodyColourContext } from "../colourContext"
import { useNoiseTexture } from "./useNoiseTexture"
import { PerfLevelContext } from "../context/perfLevel"
import { COLOUR } from "./colours"

export const useBodyMaterial = (): MeshPhysicalMaterial => {
  const bodyColour = useContext(BodyColourContext)
  const perfLevel = useContext(PerfLevelContext)

  const clearcoatRoughnessMap = useNoiseTexture({
    size: 16,
    min: 220,
    max: 255,
  })
  const clearcoatMap = useNoiseTexture({
    size: 32,
    min: 64,
    max: 80,
  })
  const roughnessMap = useNoiseTexture({ size: 1024, min: 230, max: 245 })

  const metalnessMap = useNoiseTexture({
    size: 64,
    min: 0,
    max: 255,
    pixelModFunc: ([r, g, b]) => {
      const newB = b > 200 ? 255 : 0
      return [r, g, newB]
    },
  })

  return useMemo(() => {
    const material = new MeshPhysicalMaterial()

    if (bodyColour.startsWith("trans_")) {
      material.transmission = 0.95
      material.opacity = 1
      material.roughness = 0.25
      material.color = new Color(COLOUR[bodyColour] || "red")
      material.ior = 1.46
      material.clearcoat = 1
      material.clearcoatRoughness = 1
      material.transparent = true
      // this causes random glitchy squares for some reason
      // - though it looks better when it's on
      // material.side = DoubleSide
    } else if (bodyColour.startsWith("aluminium_")) {
      material.color = new Color(COLOUR[bodyColour] || "red")
      material.ior = 1.36

      material.clearcoat = 0
      material.metalness = 1
      material.roughness = 0.5
      material.roughnessMap = roughnessMap
      material.bumpMap = metalnessMap
      material.bumpScale = 0.1
      material.envMapIntensity = 1
    } else {
      material.envMapIntensity = 0.5
      material.color = new Color(COLOUR[bodyColour] || "red")
      material.emissive = material.color
      material.emissiveIntensity = bodyColour === "glow" ? 0.7 : 0
      if (perfLevel >= 1) {
        material.metalness = bodyColour === "silver" ? 1 : 0
        material.metalnessMap = metalnessMap
        material.roughnessMap = roughnessMap
        if (perfLevel >= 2) {
          material.clearcoatMap = clearcoatMap
          material.clearcoatRoughnessMap = clearcoatRoughnessMap
        }
      }
    }

    return material
  }, [
    bodyColour,
    clearcoatMap,
    clearcoatRoughnessMap,
    metalnessMap,
    roughnessMap,
    perfLevel,
  ])
}
