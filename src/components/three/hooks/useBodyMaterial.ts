import { useContext, useMemo } from "react"
import { Color, DoubleSide, MeshPhysicalMaterial } from "three"
import { BodyColourContext } from "../colourContext"
import { useNoiseTexture } from "./useNoiseTexture"
import { PocketColour } from "../../../types"

const COLOUR = {
  black: "rgb(0,0,0)",
  white: "rgb(245,245,245)",
  glow: "rgb(163, 195, 138)",
  indigo: "rgb(80, 76, 137)",
  red: "rgb(135, 43, 42)",
  green: "rgb(6, 138, 100)",
  blue: "rgb(68, 90, 153)",
  yellow: "rgb(227, 175, 45)",
  pink: "rgb(238, 141, 183)",
  orange: "rgb(236, 159, 74)",
  silver: "rgb(208, 205, 204)",
  trans_purple: "rgb(205,175,250)",
  trans_orange: "rgb(200,130,10)",
  trans_clear: "rgb(220,220,220)",
  trans_smoke: "rgb(120,120,120)",
  trans_red: "rgb(235, 90, 90)",
  trans_blue: "rgb(110, 100, 255)",
  trans_green: "rgb(110, 255, 110)",
} as Record<PocketColour, string>

export const useBodyMaterial = (): MeshPhysicalMaterial => {
  const bodyColour = useContext(BodyColourContext)

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
  const roughnessMap = useNoiseTexture({ size: 64, min: 230, max: 245 })

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
      material.transmission = 0.975
      material.opacity = 1
      material.roughness = 0.2
      material.color = new Color(COLOUR[bodyColour] || "red")
      material.ior = 1.46
      material.clearcoat = 1
      material.clearcoatRoughness = 1
      material.transparent = true
      material.side = DoubleSide
    } else {
      material.envMapIntensity = 0.5
      material.metalness = bodyColour === "silver" ? 1 : 0
      material.metalnessMap = metalnessMap
      material.color = new Color(COLOUR[bodyColour] || "red")
      material.emissive = material.color
      material.emissiveIntensity = bodyColour === "glow" ? 0.7 : 0
      material.roughnessMap = roughnessMap
      material.clearcoatMap = clearcoatMap
      material.clearcoatRoughnessMap = clearcoatRoughnessMap
    }

    return material
  }, [
    bodyColour,
    clearcoatMap,
    clearcoatRoughnessMap,
    metalnessMap,
    roughnessMap,
  ])
}
