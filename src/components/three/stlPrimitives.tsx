import { useLoader } from "@react-three/fiber"
import { STLLoader } from "three/examples/jsm/loaders/STLLoader"
import frontSTL from "../../../openscad_models/front.stl"
import backSTL from "../../../openscad_models/back.stl"
import dpadSTL from "../../../openscad_models/dpad.stl"
import concaveButtonSTL from "../../../openscad_models/concave_button.stl"
import convexButtonSTL from "../../../openscad_models/convex_button.stl"
import shoulderButtonSTL from "../../../openscad_models/shoulder_button.stl"

import powerButtonSTL from "../../../openscad_models/power_button.stl"
import volumeButtonSTL from "../../../openscad_models/volume_button.stl"

import boardSTL from "../../../openscad_models/board.stl"

export const FrontMeshPrimitive = () => {
  const geom = useLoader(STLLoader, frontSTL)
  return <primitive object={geom} attach="geometry" />
}
export const BackMeshPrimitive = () => {
  const geom = useLoader(STLLoader, backSTL)
  return <primitive object={geom} attach="geometry" />
}
export const DpadPrimitive = () => {
  const geom = useLoader(STLLoader, dpadSTL)
  return <primitive object={geom} attach="geometry" />
}
export const ConcavePrimitive = () => {
  const geom = useLoader(STLLoader, concaveButtonSTL)
  return <primitive object={geom} attach="geometry" />
}
export const ConvexPrimitive = () => {
  const geom = useLoader(STLLoader, convexButtonSTL)
  return <primitive object={geom} attach="geometry" />
}
export const ShoulderButtonPrimitive = () => {
  const geom = useLoader(STLLoader, shoulderButtonSTL)
  return <primitive object={geom} attach="geometry" />
}
export const PowerButtonPrimitive = () => {
  const geom = useLoader(STLLoader, powerButtonSTL)
  return <primitive object={geom} attach="geometry" />
}
export const VolumeButtonPrimitive = () => {
  const geom = useLoader(STLLoader, volumeButtonSTL)
  return <primitive object={geom} attach="geometry" />
}
export const BoardPrimitive = () => {
  const geom = useLoader(STLLoader, boardSTL)
  return <primitive object={geom} attach="geometry" />
}
