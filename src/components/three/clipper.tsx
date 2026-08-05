import * as THREE from "three"
import { useRef, useEffect, useMemo } from "react"
import { useFrame } from "@react-three/fiber"

type ClipperProps = {
  normal: [number, number, number] // e.g., [0, 0, 1] for Z-axis
  offset?: number // e.g., 0.5
  children: React.ReactNode
}

export const Clipper = ({ normal, offset = 0, children }: ClipperProps) => {
  const contentRef = useRef<THREE.Group>(null)
  const trackerRef = useRef<THREE.Group>(null)

  const basePlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(...normal), offset),
    [normal, offset]
  )
  const activePlane = useMemo(() => new THREE.Plane(), [])

  useEffect(() => {
    if (!contentRef.current) return

    contentRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material]

        const clonedMaterials = materials.map((mat) => {
          const newMat = mat.clone()
          newMat.clippingPlanes = [activePlane] // Bind by reference
          newMat.needsUpdate = true
          newMat.side = THREE.DoubleSide
          return newMat
        })

        child.material = Array.isArray(child.material)
          ? clonedMaterials
          : clonedMaterials[0]
      }
    })
  }, [activePlane])

  useFrame(() => {
    if (trackerRef.current) {
      activePlane.copy(basePlane).applyMatrix4(trackerRef.current.matrixWorld)
    }
  })

  return (
    <group>
      <group ref={trackerRef} />
      <group ref={contentRef}>{children}</group>
    </group>
  )
}
