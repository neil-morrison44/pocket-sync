import { useContext, useMemo } from "react"
import { Color, MeshPhysicalMaterial } from "three"
import { BodyColourContext, ButtonsColourContext } from "../colourContext"
import { useNoiseTexture } from "./useNoiseTexture"
import { PocketColour } from "../../../types"
import { PerfLevelContext } from "../context/perfLevel"

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

export const useButtonsMaterial = (
  bodyMaterial: MeshPhysicalMaterial
): MeshPhysicalMaterial => {
  const bodyColour = useContext(BodyColourContext)
  const buttonsColour = useContext(ButtonsColourContext)
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
    if (buttonsColour === bodyColour) return bodyMaterial
    const material = new MeshPhysicalMaterial()

    if (buttonsColour.startsWith("trans_")) {
      material.transmission = 0.95
      material.opacity = 1
      material.roughness = 0.25
      material.color = new Color(COLOUR[buttonsColour] || "red")
      material.ior = 1.46
      material.clearcoat = 1
      material.clearcoatRoughness = 1
      material.transparent = true
      // this causes random glitchy squares for some reason
      // - though it looks better when it's on
      // material.side = DoubleSide
    } else {
      material.envMapIntensity = 0.5
      material.color = new Color(COLOUR[buttonsColour] || "red")
      material.emissive = material.color
      material.emissiveIntensity = buttonsColour === "glow" ? 0.7 : 0
      if (perfLevel >= 1) {
        material.metalness = buttonsColour === "silver" ? 1 : 0
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
    buttonsColour,
    bodyColour,
    bodyMaterial,
    perfLevel,
    metalnessMap,
    roughnessMap,
    clearcoatMap,
    clearcoatRoughnessMap,
  ])
}
