import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { Environment, PerformanceMonitor, RoundedBox } from "@react-three/drei"
import { ReactNode, useCallback, useContext, useMemo, useRef } from "react"
import "./index.css"
import {
  DoubleSide,
  Group,
  Material,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  NoToneMapping,
  TextureLoader,
} from "three"
import { Bloom, EffectComposer, N8AO } from "@react-three/postprocessing"
import { KernelSize } from "postprocessing"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import * as THREE from "three"

import envMap from "./small_empty_room_1_1k.hdr"
import screenAlphaMap from "./screen_alpha.png"
import boardGLB from "./board.glb"

import {
  FrontMeshPrimitive,
  BackMeshPrimitive,
  ConcavePrimitive,
  ConvexPrimitive,
  DpadPrimitive,
  ShoulderButtonPrimitive,
  PowerButtonPrimitive,
  VolumeButtonPrimitive,
} from "./stlPrimitives"
import { BodyColourContext } from "./colourContext"
import { useBodyMaterial } from "./hooks/useBodyMaterial"
import { useButtonsMaterial } from "./hooks/useButtonsMaterial"
import { PerfLevelContext } from "./context/perfLevel"
import { useRecoilState } from "recoil"
import { performanceLevelAtom } from "../../recoil/atoms"

type PocketProps = {
  move?: "none" | "spin" | "back-and-forth"
  screenMaterial?: ReactNode
  children?: ReactNode
}

const SWAY_SPEED = 0.2
const MAX_PERF_LEVEL = 3

export const Pocket = ({
  move = "none",
  screenMaterial,
  children,
}: PocketProps) => {
  const [perfLevel, setPerfLevel] = useRecoilState(performanceLevelAtom)
  const seenPerfLevelsRef = useRef(new Array<number>())
  const dprScale = [0.5, 0.75, 1, 1][perfLevel]

  const setAndStorePerfLevel = useCallback(
    (updater: (currVal: number) => number) => {
      setPerfLevel((curr) => {
        const newValue = updater(curr)
        seenPerfLevelsRef.current.push(newValue)
        return newValue
      })
    },
    [setPerfLevel]
  )

  return (
    <Canvas
      shadows
      className="three-pocket"
      camera={{ fov: 50, position: [0, 0, 42] }}
      onCreated={(state) => (state.gl.toneMapping = NoToneMapping)}
      dpr={window.devicePixelRatio * dprScale}
    >
      <PerformanceMonitor
        onIncline={() => {
          setAndStorePerfLevel((pl) => Math.min(MAX_PERF_LEVEL, pl + 1))
        }}
        onDecline={() => {
          setAndStorePerfLevel((pl) => Math.max(0, pl - 1))
        }}
        flipflops={4}
        onFallback={() => {
          setPerfLevel(
            Math.min(
              seenPerfLevelsRef.current.at(-3) as number,
              seenPerfLevelsRef.current.at(-2) as number,
              seenPerfLevelsRef.current.at(-1) as number
            )
          )
        }}
      />
      <PerfLevelContext.Provider value={perfLevel}>
        {/* <Perf deepAnalyze matrixUpdate /> */}
        <Environment files={envMap} />
        <Lights />
        <Body move={move} screenMaterial={screenMaterial} />
        {/* <OrbitControls enablePan={false} /> */}
        {/* <Stats showPanel={0} /> */}
        <PostEffects />
        {children && children}
      </PerfLevelContext.Provider>
    </Canvas>
  )
}

const PostEffects = () => {
  const colour = useContext(BodyColourContext)
  const perfLevel = useContext(PerfLevelContext)
  if (perfLevel === 0 || (colour !== "glow" && perfLevel <= 2)) return null

  return (
    <EffectComposer>
      {colour == "glow" ? (
        <Bloom
          intensity={0.05}
          luminanceThreshold={0.8}
          kernelSize={KernelSize.HUGE}
          luminanceSmoothing={0.025}
        />
      ) : (
        <></>
      )}
      {perfLevel > 2 ? (
        <N8AO
          color="black"
          aoRadius={1.5}
          intensity={4}
          depthAwareUpsampling={false}
          quality="performance"
          halfRes={window.devicePixelRatio > 1}
        />
      ) : (
        <></>
      )}
    </EffectComposer>
  )
}

const Lights = () => {
  const perfLevel = useContext(PerfLevelContext)
  return (
    <>
      <pointLight
        position={[-5, 22, 10]}
        intensity={1500}
        castShadow={perfLevel > 1}
      />
      <pointLight
        position={[0, -20, 10]}
        intensity={250}
        castShadow={perfLevel > 2}
      />
    </>
  )
}

const Body = ({
  move,
  screenMaterial,
}: Pick<PocketProps, "move" | "screenMaterial">) => {
  const bodyColour = useContext(BodyColourContext)
  const perfLevel = useContext(PerfLevelContext)

  const groupRef = useRef<THREE.Group>(null)
  const speedRef = useRef<number>(SWAY_SPEED)
  useFrame((_, delta) => {
    if (groupRef.current && speedRef.current) {
      const speed = speedRef.current
      switch (move) {
        case "spin":
          groupRef.current.rotateY(-0.6 * speed * delta)
          break
        case "back-and-forth":
          groupRef.current.rotateY(-0.6 * speed * delta)
          if (groupRef.current.rotation.y > 0.4) {
            speedRef.current = SWAY_SPEED
          } else if (groupRef.current.rotation.y < -0.4) {
            speedRef.current = -SWAY_SPEED
          }
          break
        default:
          break
      }
    }
  })

  const bodyMaterial = useBodyMaterial()
  const buttonsMaterial = useButtonsMaterial(bodyMaterial)
  const powerButtonMaterial = useMemo(
    () =>
      bodyColour === "black" || bodyColour === "white"
        ? new MeshBasicMaterial({ color: "rgb(88, 144, 80)" })
        : buttonsMaterial,
    [bodyColour, buttonsMaterial]
  )

  return (
    <group ref={groupRef} rotation={[0, move === "spin" ? 1 : 0, -0.2]}>
      <mesh
        scale={[0.2, 0.2, 0.2]}
        rotation={[0, Math.PI, 0]}
        position={[0, 0, 1.05]}
        material={bodyMaterial}
        receiveShadow={perfLevel > 0}
        castShadow={perfLevel > 1}
      >
        <FrontMeshPrimitive />
      </mesh>
      <mesh
        scale={[0.2, 0.2, 0.2]}
        rotation={[0, 0, 0]}
        position={[0, 0, -1.66]}
        material={bodyMaterial}
        receiveShadow={perfLevel > 0}
        castShadow={perfLevel > 1}
      >
        <BackMeshPrimitive />
      </mesh>

      {bodyColour.startsWith("trans_") && (
        <>
          <MainBoard />
          <Speakers />
          <Battery />
        </>
      )}

      <Buttons material={buttonsMaterial} />
      <DPAD material={buttonsMaterial} />
      <BottomButtons material={buttonsMaterial} />
      <ShoulderButtons material={buttonsMaterial} />

      <Screen screenMaterial={screenMaterial} />

      {/* Power Button */}
      <mesh
        position={[-8.3, 5.678, -0.07]}
        scale={[0.2, 0.2, 0.2]}
        rotation={[0, Math.PI / 2, 0]}
        material={powerButtonMaterial}
      >
        <PowerButtonPrimitive />
        {/* <meshBasicMaterial attach="material" color="rgb(88, 144, 80)" /> */}
      </mesh>
      {/* Volume Button */}

      <mesh
        position={[-8.35, 8.1, -0.07]}
        scale={[0.2, 0.2, 0.2]}
        rotation={[0, -Math.PI / 2, 0]}
        material={buttonsMaterial}
        receiveShadow
      >
        <VolumeButtonPrimitive />
      </mesh>
    </group>
  )
}

const Screen = ({ screenMaterial }: PocketProps) => {
  const bodyColour = useContext(BodyColourContext)
  const alphaMap = useLoader(TextureLoader, screenAlphaMap)

  return (
    <>
      {/* colour */}
      <mesh position={[0, 6.8, 1.1]}>
        <planeGeometry attach="geometry" args={[17.25, 15.95]} />
        <meshPhysicalMaterial
          ior={1.46}
          color={bodyColour === "white" ? "rgb(255,255,255)" : "black"}
          reflectivity={0.3}
          alphaMap={alphaMap}
          alphaTest={0.5}
          clearcoat={1}
          clearcoatRoughness={0}
          envMapIntensity={0.1}
        />
      </mesh>

      {/* LCD */}
      <mesh position={[0, 7, 1.2]}>
        <planeGeometry attach="geometry" args={[160 / 11.5, 140 / 11.5]} />
        {screenMaterial || (
          <meshPhysicalMaterial
            attach="material"
            color="green"
            clearcoat={1}
            clearcoatRoughness={0}
            envMapIntensity={0.01}
            emissive={"green"}
            emissiveIntensity={10}
          />
        )}
      </mesh>
    </>
  )
}

const BUTTON_GAP = 1.25 as const

const Buttons = ({ material }: { material: Material }) => {
  const positions = [
    [BUTTON_GAP, 0, BUTTON_GAP],
    [-BUTTON_GAP, 0, BUTTON_GAP],
    [-BUTTON_GAP, 0, -BUTTON_GAP],
    [BUTTON_GAP, 0, -BUTTON_GAP],
  ] as const

  const refs = [
    useRef<Mesh>(null),
    useRef<Mesh>(null),
    useRef<Mesh>(null),
    useRef<Mesh>(null),
  ]
  const hoverButtonRef = useRef<keyof typeof refs | null>(null)

  useFrame(() => {
    refs.forEach((buttonRef, index) => {
      if (buttonRef.current) {
        if (hoverButtonRef.current === index) {
          buttonRef.current.position.y = MathUtils.lerp(
            buttonRef.current.position.y,
            -0.5,
            0.25
          )
        } else {
          buttonRef.current.position.y = MathUtils.lerp(
            buttonRef.current.position.y,
            0,
            0.25
          )
        }
      }
    })
  })

  return (
    <group
      position={[4.9, -5.2, 0.8]}
      rotation={[Math.PI / 2, Math.PI / 4, 0]}
      castShadow
      receiveShadow
    >
      {positions.map((p, index) => (
        <mesh
          ref={refs[index]}
          position={p}
          key={index}
          castShadow
          receiveShadow
          onPointerEnter={() => (hoverButtonRef.current = index)}
          onPointerLeave={() => (hoverButtonRef.current = null)}
          scale={[0.2, 0.2, 0.2]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={material}
        >
          {index > 1 ? <ConcavePrimitive /> : <ConvexPrimitive />}
        </mesh>
      ))}
    </group>
  )
}

const BottomButtons = ({ material }: { material: Material }) => {
  const positions = [
    [BUTTON_GAP, 0, BUTTON_GAP],
    [0, 0, 0],
    [-BUTTON_GAP, 0, -BUTTON_GAP],
  ] as const

  const refs = [useRef<Mesh>(null), useRef<Mesh>(null), useRef<Mesh>(null)]
  const hoverButtonRef = useRef<keyof typeof refs | null>(null)

  useFrame(() => {
    refs.forEach((buttonRef, index) => {
      if (buttonRef.current) {
        if (hoverButtonRef.current === index) {
          buttonRef.current.position.y = MathUtils.lerp(
            buttonRef.current.position.y,
            -0.25,
            0.25
          )
        } else {
          buttonRef.current.position.y = MathUtils.lerp(
            buttonRef.current.position.y,
            0,
            0.25
          )
        }
      }
    })
  })

  return (
    <group
      position={[0, -11.9, 0.6]}
      rotation={[Math.PI / 2, Math.PI / 4, 0]}
      castShadow
      receiveShadow
    >
      {positions.map((p, index) => (
        <mesh
          position={p}
          key={index}
          ref={refs[index]}
          onPointerEnter={() => (hoverButtonRef.current = index)}
          onPointerLeave={() => (hoverButtonRef.current = null)}
          castShadow
          receiveShadow
          material={material}
        >
          <cylinderGeometry attach="geometry" args={[0.5, 0.5, 1.5, 12]} />
        </mesh>
      ))}
    </group>
  )
}

const DPAD = ({ material }: { material: Material }) => {
  const hoverRef = useRef<boolean>(false)
  const angleRef = useRef<number>(0)
  const groupRef = useRef<Group>(null)

  useFrame(() => {
    if (groupRef.current && hoverRef.current) {
      groupRef.current.rotation.z = MathUtils.lerp(
        groupRef.current.rotation.z,
        Math.cos(angleRef.current - Math.PI) / 5,
        0.25
      )
      groupRef.current.rotation.x = MathUtils.lerp(
        groupRef.current.rotation.x,
        Math.sin(angleRef.current) / 5,
        0.25
      )
    }
  })

  return (
    <group
      onPointerEnter={() => (hoverRef.current = true)}
      onPointerLeave={() => {
        hoverRef.current = false
        groupRef.current?.rotation.set(0, 0, 0)
      }}
      position={[-4.9, -5.2, 1]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <mesh
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[6, 6, 6]}
        onPointerMove={(e) => {
          if (!e.uv) return
          const { x, y } = e.uv
          angleRef.current = Math.atan2(y - 0.5, x - 0.5)
        }}
      >
        <planeGeometry />
        <meshBasicMaterial opacity={0} transparent side={DoubleSide} />
      </mesh>

      <group ref={groupRef}>
        <mesh
          castShadow
          receiveShadow
          scale={[0.2, 0.2, 0.2]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={material}
        >
          <DpadPrimitive />
        </mesh>
      </group>
    </group>
  )
}

const ShoulderButtons = ({ material }: { material: Material }) => {
  const leftButtonRef = useRef<Mesh>(null)
  const leftButtonHoverRef = useRef(false)

  const rightButtonRef = useRef<Mesh>(null)
  const rightButtonHoverRef = useRef(false)

  const BUTTON_UP = 3.25
  const BUTTON_DOWN = 2.8

  useFrame(() => {
    if (leftButtonRef.current) {
      if (leftButtonHoverRef.current) {
        leftButtonRef.current.position.y = MathUtils.lerp(
          leftButtonRef.current.position.y,
          BUTTON_DOWN,
          0.25
        )
      } else {
        leftButtonRef.current.position.y = MathUtils.lerp(
          leftButtonRef.current.position.y,
          BUTTON_UP,
          0.25
        )
      }
    }

    if (rightButtonRef.current) {
      if (rightButtonHoverRef.current) {
        rightButtonRef.current.position.y = MathUtils.lerp(
          rightButtonRef.current.position.y,
          BUTTON_DOWN,
          0.25
        )
      } else {
        rightButtonRef.current.position.y = MathUtils.lerp(
          rightButtonRef.current.position.y,
          BUTTON_UP,
          0.25
        )
      }
    }
  })

  return (
    <>
      <mesh
        position={[-7.3, BUTTON_DOWN, -2.6]}
        ref={leftButtonRef}
        onPointerEnter={() => (leftButtonHoverRef.current = true)}
        onPointerLeave={() => (leftButtonHoverRef.current = false)}
        scale={[0.2, -0.2, 0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
        material={material}
      >
        <ShoulderButtonPrimitive />
      </mesh>
      <mesh
        position={[7.3, BUTTON_DOWN, -2.6]}
        ref={rightButtonRef}
        onPointerEnter={() => (rightButtonHoverRef.current = true)}
        onPointerLeave={() => (rightButtonHoverRef.current = false)}
        scale={[0.2, 0.2, 0.2]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
        material={material}
      >
        <ShoulderButtonPrimitive />
      </mesh>
    </>
  )
}

const Battery = () => {
  return (
    <mesh position={[0, -6.5, -2]}>
      <RoundedBox castShadow receiveShadow args={[14, 9, 2]} radius={0.5}>
        <meshBasicMaterial attach="material" color="rgb(0, 0, 0)" />
      </RoundedBox>
    </mesh>
  )
}

const Speakers = () => {
  return (
    <>
      <mesh position={[6.6, 11.5, 0]}>
        <RoundedBox castShadow receiveShadow args={[3.5, 5, 2]} radius={0.5}>
          <meshBasicMaterial attach="material" color="rgb(0, 0, 0)" />
        </RoundedBox>
      </mesh>
      <mesh position={[-6.6, 11.5, 0]}>
        <RoundedBox castShadow receiveShadow args={[3.5, 5, 2]} radius={0.5}>
          <meshBasicMaterial attach="material" color="rgb(0, 0, 0)" />
        </RoundedBox>
      </mesh>
    </>
  )
}

const MainBoard = () => {
  const board = useLoader(GLTFLoader, boardGLB)
  return (
    <group
      scale={[6, 6, 6]}
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, -0.1, -0.4]}
    >
      <primitive object={board.scene} />
    </group>
  )
}
