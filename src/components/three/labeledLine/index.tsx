import * as THREE from "three"
import { ReactNode, useLayoutEffect, useMemo, useRef } from "react"
import { Html } from "@react-three/drei"
import { PocketSyncConfigSelector } from "../../../recoil/config/selectors"
import { useAtomValue } from "jotai"

type LabeledLineProps = {
  start: THREE.Vector3Tuple
  end: THREE.Vector3Tuple
  children?: ReactNode
}

export const LabeledLine = ({ start, end, children }: LabeledLineProps) => {
  const ref = useRef<THREE.Line | null>(null)
  const { colour } = useAtomValue(PocketSyncConfigSelector)
  const inversePocketColour = useMemo(() => {
    if (colour === "white") return "black"
    return "white"
  }, [colour])

  useLayoutEffect(() => {
    ref.current?.geometry.setFromPoints(
      [start, end].map((point) => new THREE.Vector3(...point))
    )
  }, [start, end])
  return (
    <>
      {/* @ts-ignore this isn't an SVG line */}
      <line ref={ref} raycast={() => false}>
        <bufferGeometry />
        <lineBasicMaterial color={inversePocketColour} linewidth={5} />
      </line>

      {children && (
        <Html
          center
          position={end}
          style={{
            textAlign: "center",
            whiteSpace: "nowrap",
            background: inversePocketColour,
            color: inversePocketColour === "white" ? "black" : "white",
            padding: "0px 10px",
            borderRadius: "10px",
          }}
          occlude
        >
          {children}
        </Html>
      )}
    </>
  )
}
