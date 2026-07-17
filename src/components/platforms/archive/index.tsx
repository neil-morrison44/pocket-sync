import {
  createContext,
  startTransition,
  Suspense,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import * as THREE from "three"
import {
  PlatformInfoSelectorFamily,
  platformsListSelector,
} from "../../../jotai/platforms/selectors"
import { Modal } from "../../modal"
import { useTranslation } from "react-i18next"
import { Size } from "@react-three/fiber"
import "./index.css"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber"
import { NoToneMapping } from "three"
import {
  Html,
  MeshPortalMaterial,
  useCursor,
  useTexture,
} from "@react-three/drei"
import { Body, Lights, PostEffects } from "../../three/pocket"
import { PocketEnv } from "../../three/env"
import { Clipper } from "../../three/clipper"
import { ColourContextProviderFromConfig } from "../../three/colourContext"

import velvet_diff_tex from "./velvet_texture/velour_velvet_diff_2k.jpg"
import velvet_nor_tex from "./velvet_texture/velour_velvet_nor_gl_2k.jpg"
import velvet_arm_tex from "./velvet_texture/velour_velvet_arm_2k.jpg"
import velvet_spec_ior_tex from "./velvet_texture/velour_velvet_spec_ior_2k.jpg"
import {
  useArchivePlatforms,
  usePlatformTextureAtlas,
  useSetupPositions,
} from "./hooks"
import { GlassGrid, GridCell } from "./glassGrid"
import { PlatformImage } from "../../cores/platformImage"
import { PlatformsBucket } from "./bucket"
import {
  addPlatformItemsAtom,
  draggedPlatformsAtom,
  platformModalCursorPositonAtom,
  platformModalPositionAtom,
} from "../../../jotai/platforms/atoms"
import { PlatformArchiveDragItemLayer } from "./dragItemLayer"

type PlatformArchiveProps = {
  onClose: () => void
}

export const PlatformArchive = ({ onClose }: PlatformArchiveProps) => {
  const { t } = useTranslation("platforms")
  const [pocketIsOpen, setPocketIsOpen] = useState<boolean>(false)

  useLayoutEffect(() => {
    const timeout = window.setTimeout(() => setPocketIsOpen(true), 1.5e3)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [])

  const setCursorPosition = useSetAtom(platformModalCursorPositonAtom)
  const [draggingPlatformId, setDraggingPlatformId] =
    useAtom(draggedPlatformsAtom)
  const contentContainerRef = useRef<HTMLDivElement>(null)

  const archivePlatforms = useArchivePlatforms(onClose)

  useSetupPositions()

  return (
    <Modal className="platform-archive">
      <div
        className="platform-archive__content"
        ref={contentContainerRef}
        style={{ cursor: draggingPlatformId ? "grabbing" : "unset" }}
        onMouseUp={(_e) => setDraggingPlatformId(null)}
        onMouseMove={(e) => {
          if (contentContainerRef.current) {
            const rect = contentContainerRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            setCursorPosition([x, y])
          }
        }}
      >
        <Suspense>
          <PlatformArchiveDragItemLayer />
        </Suspense>
        <Canvas
          shadows
          className="platform-archive__3d-preview"
          gl={{ localClippingEnabled: true }}
          camera={{ fov: 50, position: [0, 0, 42] }}
          onCreated={(state) => (state.gl.toneMapping = NoToneMapping)}
          dpr={window.devicePixelRatio}
        >
          <Scene pocketIsOpen={pocketIsOpen} />
        </Canvas>

        <Suspense>
          <PlatformsBucket />
        </Suspense>
      </div>

      <div className="platform-archive__buttons">
        <button onClick={archivePlatforms}>{t("archive.apply_changes")}</button>
        <button onClick={onClose}>{t("archive.close")}</button>
      </div>
    </Modal>
  )
}

const Scene = ({ pocketIsOpen }: { pocketIsOpen: boolean }) => {
  return (
    <>
      <Suspense>
        <PocketEnv />
      </Suspense>
      <Lights />

      <ColourContextProviderFromConfig>
        <Suspense>
          <PocketSuitcase isOpen={pocketIsOpen} />
        </Suspense>
      </ColourContextProviderFromConfig>
      <PostEffects />
    </>
  )
}

const SLICE_Z = -0
const HINGE_X = -8.75
const OPEN_ANGLE = Math.PI / 1.5
const ANIMATION_SPEED = 3

type PocketSuitcaseProps = {
  isOpen: boolean
}

const PocketSuitcase = ({ isOpen }: PocketSuitcaseProps) => {
  const mainGroupRef = useRef<THREE.Group>(null)
  const frontHingeRef = useRef<THREE.Group>(null)

  useFrame((_state, delta) => {
    if (mainGroupRef.current) {
      const targetRotationZ = isOpen ? Math.PI / 2 : 0
      const targetRotationX = isOpen ? -(Math.PI / 5) : 0
      const targetPositionZ = isOpen ? 19 : 0

      mainGroupRef.current.rotation.z = THREE.MathUtils.damp(
        mainGroupRef.current.rotation.z,
        targetRotationZ,
        3.5 / ANIMATION_SPEED, // Adjust this number: higher is faster, lower is slower/floatier
        delta
      )

      mainGroupRef.current.rotation.x = THREE.MathUtils.damp(
        mainGroupRef.current.rotation.x,
        targetRotationX,
        4 / ANIMATION_SPEED, // Adjust this number: higher is faster, lower is slower/floatier
        delta
      )

      mainGroupRef.current.position.z = THREE.MathUtils.damp(
        mainGroupRef.current.position.z,
        targetPositionZ,
        3 / ANIMATION_SPEED, // Adjust this number: higher is faster, lower is slower/floatier
        delta
      )
    }

    if (frontHingeRef.current) {
      const targetAngle = isOpen ? OPEN_ANGLE : 0

      frontHingeRef.current.rotation.y = THREE.MathUtils.damp(
        frontHingeRef.current.rotation.y,
        targetAngle,
        4 / ANIMATION_SPEED,
        delta
      )
    }
  })

  const width = 29.5
  const height = 17.2
  const radius = 1.5
  const depth = 6
  const cellSize = 0.0047

  const roundedPlaneShape = useMemo(() => {
    const shape = new THREE.Shape()
    const x = -width / 2
    const y = -height / 2
    shape.moveTo(x, y)
    shape.lineTo(x + width - radius, y)
    shape.quadraticCurveTo(x + width, y, x + width, y + radius)
    shape.lineTo(x + width, y + height - radius)
    shape.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    )
    shape.lineTo(x, y + height)
    shape.lineTo(x, y)
    return shape
  }, [])

  const mainCamera = useThree((state) => state.camera)
  const mainSize = useThree((state) => state.size)
  const portalRef = useRef<THREE.Mesh>(null)

  const portalContextValue = useMemo(
    () => ({
      mainCamera,
      mainSize,
      portalRef,
    }),
    [mainCamera, mainSize, portalRef]
  )

  const handleDrop = useAtomCallback(
    useCallback((get, set, col: number, row: number) => {
      const draggedItem = get(draggedPlatformsAtom)
      if (draggedItem) {
        switch (draggedItem.type) {
          case "platform": {
            startTransition(() => {
              set(addPlatformItemsAtom, { id: draggedItem.id, row, col })
            })
            break
          }
          case "group": {
            const maxColumn = Math.max(
              ...draggedItem.platforms.map(({ col }) => col)
            )
            const maxRow = Math.max(
              ...draggedItem.platforms.map(({ row }) => row)
            )

            const midColumn = Math.round(maxColumn / 2)
            const midRow = Math.round(maxRow / 2)

            startTransition(() => {
              set(
                addPlatformItemsAtom,
                draggedItem.platforms.map((p) => ({
                  id: p.id,
                  col: p.col + (col - midColumn),
                  row: p.row + (row - midRow),
                }))
              )
            })
          }
        }
      }
    }, [])
  )

  return (
    <group ref={mainGroupRef}>
      <group position={[-HINGE_X, 0, SLICE_Z]} ref={frontHingeRef}>
        <group position={[HINGE_X, 0, -SLICE_Z]}>
          <Clipper normal={[0, 0, 1]} offset={-SLICE_Z}>
            <Body move={"none"} jauntyAngle={false} />
          </Clipper>
        </group>
      </group>

      <Clipper normal={[0, 0, -1]} offset={SLICE_Z}>
        <Body
          move={"none"}
          jauntyAngle={false}
          showScreen={false}
          showFaceButtons={false}
        />
      </Clipper>
      <mesh
        position={[0, 0, SLICE_Z + 0.05]}
        rotation={[0, 0, -Math.PI / 2]}
        ref={portalRef}
      >
        <shapeGeometry args={[roundedPlaneShape]} />
        <MeshPortalMaterial resolution={1} blur={0}>
          <PortalParentContext value={portalContextValue}>
            <ambientLight intensity={0.1} />
            <pointLight position={[0, 0, 10]} intensity={200} castShadow />

            <mesh position={[0, 0, -(depth / 2)]} receiveShadow>
              <boxGeometry args={[width, height, depth]} />
              <VelvetMaterial />
            </mesh>

            <group position={[0, 0.25, -depth * 0.75]}>
              <GlassGrid
                countX={12}
                countY={20}
                cellHeight={(165 + 10) * cellSize}
                cellWidth={521 * cellSize}
                thickness={0.1}
                depth={depth / 2}
                outerWalls={false}
                onCellPointerUp={handleDrop}
              >
                <Suspense>
                  <PlatformItems />
                </Suspense>
              </GlassGrid>
            </group>
          </PortalParentContext>
        </MeshPortalMaterial>
      </mesh>
    </group>
  )
}

const VelvetMaterial = () => {
  const textures = useTexture({
    map: velvet_diff_tex,
    normalMap: velvet_nor_tex,
    roughnessMap: velvet_arm_tex,
    aoMap: velvet_arm_tex,
    metalnessMap: velvet_spec_ior_tex,
  })

  useEffect(() => {
    const scale = 0.75

    Object.values(textures).forEach((texture) => {
      if (texture instanceof THREE.Texture) {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(scale, scale)
      }
    })
  }, [textures])

  return <meshPhysicalMaterial {...textures} side={THREE.BackSide} />
}

const PlatformItems = () => {
  const platformList = useAtomValue(platformsListSelector)
  const textureAtlas = usePlatformTextureAtlas()

  const [platformModalPosition, setPlatformModalPosition] = useAtom(
    platformModalPositionAtom
  )

  return (
    <>
      {platformModalPosition.map(({ id, row, col }) => {
        return (
          <InventoryCube
            key={id}
            platformId={id}
            atlasCols={16}
            atlasRows={15}
            spriteIndex={platformList.indexOf(id)}
            atlasTexture={textureAtlas.clone()}
            gridColumn={col}
            gridRow={row}
          />
        )
      })}
    </>
  )
}

type InventoryCubeProps = {
  platformId: string
  atlasTexture: THREE.Texture
  atlasCols: number
  atlasRows: number
  spriteIndex: number
  gridColumn: number
  gridRow: number
}

const BOX_WIDTH = 521 * 0.0047
const BOX_HEIGHT = (165 + 10) * 0.0047

const sharedGeometry = new THREE.BoxGeometry(BOX_WIDTH, BOX_HEIGHT, 2.75)
const sharedSideMaterial = new THREE.MeshStandardMaterial({ color: "#aaa" })

export const InventoryCube = ({
  platformId,
  atlasTexture,
  atlasCols,
  atlasRows,
  spriteIndex,
  gridColumn,
  gridRow,
}: InventoryCubeProps) => {
  const [draggedItem, setDraggedItem] = useAtom(draggedPlatformsAtom)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered, "grab", "auto")

  const isBeingDragged =
    draggedItem?.type === "platform" && draggedItem.id === platformId

  const portalParent = use(PortalParentContext)
  const vec = useMemo(() => new THREE.Vector3(), [])

  const topFaceMaterial = useMemo(() => {
    const localTexture = atlasTexture.clone()
    localTexture.repeat.set(1 / atlasCols, 1 / atlasRows)
    const col = spriteIndex % atlasCols
    const row = Math.floor(spriteIndex / atlasCols)
    localTexture.offset.x = col / atlasCols
    localTexture.offset.y = 1 - (row + 1) / atlasRows
    localTexture.needsUpdate = true

    return new THREE.MeshStandardMaterial({
      map: localTexture,
      color: "#ffffff",
    })
  }, [atlasTexture, atlasCols, atlasRows, spriteIndex])

  useEffect(() => {
    topFaceMaterial.transparent = isBeingDragged
    ;((topFaceMaterial.opacity = isBeingDragged ? 0.4 : 1),
      (topFaceMaterial.needsUpdate = true))
  }, [isBeingDragged])

  const materialArray = useMemo(
    () => [
      sharedSideMaterial,
      sharedSideMaterial,
      sharedSideMaterial,
      sharedSideMaterial,
      topFaceMaterial,
      sharedSideMaterial,
    ],
    [topFaceMaterial]
  )

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation() // Prevent triggering hover on objects behind it
    setHovered(true)
  }

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(false)
  }

  return (
    <>
      <GridCell col={gridColumn} row={gridRow}>
        <mesh
          position={[0, 0, hovered ? 0.4 : 0.2]}
          geometry={sharedGeometry}
          scale={0.95}
          material={materialArray}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerDown={(e) => {
            setDraggedItem({ type: "platform", id: platformId })
            e.stopPropagation()
          }}
        ></mesh>
        {hovered && draggedItem === null && (
          <Html
            position={[0, 2, 0]}
            center
            zIndexRange={[100, 0]}
            style={{
              pointerEvents: "none",
              transform: "translate(-50%, -100%)",
            }}
            calculatePosition={(el) => {
              if (!portalParent) return [0, 0]
              const { mainCamera, mainSize, portalRef } = portalParent
              if (!portalRef.current) return [0, 0]
              vec.setFromMatrixPosition(el.matrixWorld)
              vec.applyMatrix4(portalRef.current.matrixWorld)
              vec.project(mainCamera)

              const stretchX = 1.1
              const stretchY = 1.1

              const x =
                (vec.x * stretchX * mainSize.width) / 2 + mainSize.width / 2
              const y =
                -(vec.y * stretchY * mainSize.height) / 2 + mainSize.height / 2

              return [x, y]
            }}
          >
            <div
              className="platform-archive__tooltip"
              style={{ pointerEvents: "none" }}
            >
              <PlatformName platformId={platformId} />
              <Suspense
                fallback={
                  <div
                    className="platform-archive__tooltip-banner"
                    style={{ aspectRatio: "521 / 165", background: "#999" }}
                  />
                }
              >
                <PlatformImage
                  platformId={platformId}
                  className="platform-archive__tooltip-banner"
                />
              </Suspense>
            </div>
          </Html>
        )}
      </GridCell>
    </>
  )
}

const PlatformName = ({ platformId }: { platformId: string }) => {
  const platformInfo = useAtomValue(PlatformInfoSelectorFamily(platformId))
  return (
    <div className="platform-archive__tooltip-name">
      {platformInfo.platform.name}
    </div>
  )
}

export const PortalParentContext = createContext<{
  mainCamera: THREE.Camera
  mainSize: Size
  portalRef: React.RefObject<THREE.Mesh | null>
} | null>(null)
