import { MeshTransmissionMaterial } from "@react-three/drei"
import { ThreeEvent } from "@react-three/fiber"
import { createContext, ReactNode, useContext, useEffect, useMemo } from "react"
import * as THREE from "three"
import { mergeBufferGeometries } from "three-stdlib"

export type GridContextValue = {
  cellWidth: number
  cellHeight: number
  totalWidth: number
  totalHeight: number
  depth: number
}

export const GridContext = createContext<GridContextValue | null>(null)

type GridCellProps = {
  col: number
  row: number
  children: ReactNode
}

export const GridCell = ({ col, row, children }: GridCellProps) => {
  const context = useContext(GridContext)
  if (!context) {
    throw new Error("GridCell must be used within a GlassGrid")
  }

  const { cellWidth, cellHeight, totalWidth, totalHeight, depth } = context

  const x = -totalWidth / 2 + cellWidth / 2 + col * cellWidth
  const y = totalHeight / 2 - cellHeight / 2 - row * cellHeight
  const z = depth / 2

  return <group position={[x, y, z]}>{children}</group>
}

type GlassGridProps = {
  countX: number
  countY: number
  cellWidth: number
  cellHeight: number
  thickness?: number
  depth?: number
  outerWalls?: boolean
  children?: React.ReactNode

  onCellPointerUp?: (col: number, row: number) => void
}

export const GlassGrid = ({
  countX,
  countY,
  cellWidth,
  cellHeight,
  thickness = 0.1,
  depth = 2,
  outerWalls = true,
  children,
  onCellPointerUp,
}: GlassGridProps) => {
  const totalWidth = countX * cellWidth
  const totalHeight = countY * cellHeight

  const mergedGeometry = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = []
    const startIndex = outerWalls ? 0 : 1

    const endX = outerWalls ? countX : countX - 1
    for (let i = startIndex; i <= endX; i++) {
      const x = -totalWidth / 2 + i * cellWidth
      const geom = new THREE.BoxGeometry(
        thickness,
        totalHeight + thickness,
        depth
      )
      geom.translate(x, 0, depth / 2)
      geometries.push(geom)
    }

    const endY = outerWalls ? countY : countY - 1
    for (let i = startIndex; i <= endY; i++) {
      const y = -totalHeight / 2 + i * cellHeight
      const geom = new THREE.BoxGeometry(
        totalWidth + thickness,
        thickness,
        depth
      )
      geom.translate(0, y, depth / 2)
      geometries.push(geom)
    }

    const merged = mergeBufferGeometries(geometries)
    geometries.forEach((g) => g.dispose())

    return merged
  }, [
    countX,
    countY,
    cellWidth,
    cellHeight,
    thickness,
    depth,
    totalWidth,
    totalHeight,
    outerWalls,
  ])

  useEffect(() => {
    return () => {
      mergedGeometry?.dispose()
    }
  }, [mergedGeometry])

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!onCellPointerUp || !e.uv) return
    e.stopPropagation()
    const col = Math.floor(e.uv.x * countX)
    const row = Math.floor((1 - e.uv.y) * countY)

    const safeCol = Math.min(Math.max(col, 0), countX - 1)
    const safeRow = Math.min(Math.max(row, 0), countY - 1)

    onCellPointerUp(safeCol, safeRow)
  }

  if (!mergedGeometry) return null

  return (
    <GridContext
      value={{ cellWidth, cellHeight, totalWidth, totalHeight, depth }}
    >
      <group>
        <mesh geometry={mergedGeometry}>
          <MeshTransmissionMaterial
            transmissionSampler
            transmission={0.75}
            transparent={true}
            opacity={1}
            roughness={0.3}
            metalness={0.1}
            ior={1.5}
            thickness={depth}
            clearcoat={0.5}
            clearcoatRoughness={0.4}
            color="#bbb"
          />
        </mesh>
        <mesh position={[0, 0, depth]} onPointerUp={handlePointerUp}>
          <planeGeometry args={[totalWidth, totalHeight]} />
          <meshBasicMaterial visible={false} />
        </mesh>
        {children}
      </group>
    </GridContext>
  )
}
