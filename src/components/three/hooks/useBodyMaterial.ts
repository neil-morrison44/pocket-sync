import { useContext, useMemo } from "react"
import { Color, MeshPhysicalMaterial } from "three"
import { BodyColourContext } from "../colourContext"
import { useNoiseTexture } from "./useNoiseTexture"
import { PerfLevelContext } from "../context/perfLevel"
import { COLOUR } from "./colours"

export const useBodyMaterial = (): MeshPhysicalMaterial => {
  const bodyColour = useContext(BodyColourContext)
  const perfLevel = useContext(PerfLevelContext)

  const clearcoatMap = useNoiseTexture({
    size: 128,
    min: 128,
    max: 255,
  })
  const roughnessMap = useNoiseTexture({ size: 512, min: 235, max: 245 })

  return useMemo(() => {
    const material = new MeshPhysicalMaterial()

    if (bodyColour.startsWith("trans_")) {
      material.transmission = 0.95
      material.opacity = 1
      material.roughness = 0.25
      material.color = new Color(COLOUR[bodyColour] || "red")
      material.ior = 1.46
      material.clearcoat = 0.5
      material.clearcoatRoughness = 0.25
      material.transparent = true
      // this causes random glitchy squares for some reason
      // - though it looks better when it's on
      // material.side = DoubleSide
    } else if (bodyColour.startsWith("aluminium_")) {
      material.envMapIntensity = 1
      material.color = new Color(COLOUR[bodyColour] || "red")
      material.ior = 1.36

      material.clearcoat = 0
      material.metalness = 1
      material.roughness = 0.5

      if (perfLevel >= 1) {
        material.roughnessMap = roughnessMap
        material.bumpMap = roughnessMap
        material.bumpScale = 1
      }
    } else {
      material.envMapIntensity = 0.5
      material.color = new Color(COLOUR[bodyColour] || "red")
      material.emissive = material.color
      material.emissiveIntensity = bodyColour === "glow" ? 0.7 : 0
      material.ior = 1.46

      if (perfLevel >= 1) {
        if (bodyColour === "silver") {
          material.metalness = 0.8
          material.bumpMap = roughnessMap
          material.bumpScale = 4
        }
        material.roughnessMap = roughnessMap
        if (perfLevel >= 2) {
          material.clearcoat = 0.25
          material.clearcoatMap = clearcoatMap
          material.clearcoatRoughness = 0.5
        }
      }
    }

    return material
  }, [bodyColour, clearcoatMap, roughnessMap, perfLevel])
}
