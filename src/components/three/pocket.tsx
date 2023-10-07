import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { Environment, OrbitControls, RoundedBox } from "@react-three/drei"
import { ReactNode, useRef } from "react"
import { useRecoilValue } from "recoil"
import { PocketSyncConfigSelector } from "../../recoil/config/selectors"

import "./index.css"
import { DoubleSide, Group, MathUtils, Mesh, TextureLoader } from "three"
import { Bloom, EffectComposer } from "@react-three/postprocessing"
import { KernelSize } from "postprocessing"

import envMap from "./studio_small_08_1k.hdr"
import boardImg from "./board.png"

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

type PocketProps = {
  move?: "none" | "spin" | "back-and-forth"
  screenMaterial?: ReactNode
  children?: ReactNode
}

const BLACK_COLOUR = "rgb(25,25,25)"
const WHITE_COLOUR = "rgb(244,244,244)"
const GLOW_COLOUR = "rgb(163, 195, 138)"

const BODY_COLOUR = {
  black: BLACK_COLOUR,
  white: WHITE_COLOUR,
  glow: GLOW_COLOUR,
}

const LIGHTING_SCALE = {
  black: 5,
  white: 1.5,
  glow: 0,
}

const SWAY_SPEED = 0.2

export const Pocket = ({
  move = "none",
  screenMaterial,
  children,
}: PocketProps) => {
  return (
    <Canvas
      shadows
      className="three-pocket"
      camera={{ fov: 50, position: [0, 0, 160] }}
    >
      <Environment files={envMap} />
      <Lights />
      <Body move={move} screenMaterial={screenMaterial} />
      <OrbitControls enablePan={false} />
      {/* <Stats /> */}
      <GlowBloom />

      {children && children}
    </Canvas>
  )
}

const GlowBloom = () => {
  const { colour } = useRecoilValue(PocketSyncConfigSelector)
  return (
    <EffectComposer enabled={colour === "glow"}>
      <Bloom
        intensity={0.05}
        luminanceThreshold={0.8}
        kernelSize={KernelSize.HUGE}
        luminanceSmoothing={0.025}
      />
    </EffectComposer>
  )
}

const Lights = () => {
  const { colour } = useRecoilValue(PocketSyncConfigSelector)
  const scale = LIGHTING_SCALE[colour]

  return (
    <>
      <ambientLight intensity={1 * scale} />
      <directionalLight position={[0, 200, 0]} intensity={5 * scale} />
      <pointLight position={[20, 10, 20]} intensity={1.5 * scale} castShadow />
      <pointLight position={[10, 20, 10]} intensity={1 * scale} castShadow />
    </>
  )
}

const Body = ({
  move,
  screenMaterial,
}: Pick<PocketProps, "move" | "screenMaterial">) => {
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

  return (
    <group ref={groupRef} rotation={[0, move === "spin" ? 1 : 0, -0.2]}>
      <mesh
        scale={[0.2, 0.2, 0.2]}
        rotation={[0, Math.PI, 0]}
        position={[0, 0, 1.05]}
        receiveShadow
      >
        <FrontMeshPrimitive />
        {/* <Material /> */}
        <TransparentMaterial />
      </mesh>
      <mesh
        scale={[0.2, 0.2, 0.2]}
        rotation={[0, 0, 0]}
        position={[0, 0, -1.66]}
        receiveShadow
      >
        <BackMeshPrimitive />
        {/* <Material /> */}
        <TransparentMaterial />
      </mesh>

      <BoardImage />
      {/* <RoundedBox
        args={[0.86 * 20, 1.49 * 20, 0.11 * 20]}
        radius={1}
        receiveShadow
      >
        <Material />
      </RoundedBox> */}
      {/* <RoundedBox
        castShadow
        receiveShadow
        args={[0.86 * 20, 1.49 * 12.5, 0.22 * 20]}
        radius={1}
        position={[0, -11 / 2, -1.2]}
      >
        <Material />
      </RoundedBox> */}

      <Battery />

      <Buttons />
      <DPAD />
      <BottomButtons />
      <ShoulderButtons />

      <Screen screenMaterial={screenMaterial} />

      {/* Power Button */}
      <mesh
        position={[-8.3, 5.678, -0.07]}
        scale={[0.2, 0.2, 0.2]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <PowerButtonPrimitive />
        <meshBasicMaterial attach="material" color="rgb(88, 144, 80)" />
      </mesh>
      {/* Volume Button */}

      <mesh
        position={[-8.35, 8.1, -0.07]}
        scale={[0.2, 0.2, 0.2]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <VolumeButtonPrimitive />
        <Material />
      </mesh>
    </group>
  )
}

const Screen = ({ screenMaterial }: PocketProps) => {
  const { colour } = useRecoilValue(PocketSyncConfigSelector)
  return (
    <>
      {/* colour */}
      <mesh position={[0, 6.8, 1.11]}>
        <planeGeometry attach="geometry" args={[17.25, 15.95]} />
        <meshPhysicalMaterial
          ior={1.46}
          color={colour === "white" ? "rgb(222,222,220)" : "black"}
          reflectivity={0.3}
        />
      </mesh>

      {/* LCD */}
      <mesh position={[0, 7, 1.12]}>
        <planeGeometry attach="geometry" args={[160 / 11.5, 140 / 11.5]} />
        {screenMaterial || (
          <meshPhongMaterial attach="material" color="green" />
        )}
      </mesh>
      {/* Glass */}
      <mesh position={[0, 6.8, 1.13]}>
        <planeGeometry attach="geometry" args={[17.25, 15.95]} />
        <meshPhysicalMaterial
          roughness={0}
          transmission={1}
          ior={1.51714}
          transparent
        />
      </mesh>
    </>
  )
}

const BUTTON_GAP = 1.25 as const

const Buttons = () => {
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
        >
          {/* <cylinderGeometry attach="geometry" args={[0.9, 0.9, 1, 16]} /> */}
          {index > 1 ? <ConcavePrimitive /> : <ConvexPrimitive />}
          {/* <Material isButton /> */}
          <TransparentMaterial />
        </mesh>
      ))}
    </group>
  )
}

const BottomButtons = () => {
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
        >
          <cylinderGeometry attach="geometry" args={[0.5, 0.5, 1.5, 12]} />
          <Material isButton />
        </mesh>
      ))}
    </group>
  )
}

const DPAD = () => {
  const args = [
    [BUTTON_GAP, 1, BUTTON_GAP * 3.5],
    [BUTTON_GAP * 3.5, 1, BUTTON_GAP],
  ] as const

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
      castShadow
      receiveShadow
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
        >
          <DpadPrimitive />
          <TransparentMaterial />
          {/* <Material isButton /> */}
        </mesh>
      </group>
    </group>
  )
}

const ShoulderButtons = () => {
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
      >
        <ShoulderButtonPrimitive />
        <Material isButton />
      </mesh>
      <mesh
        position={[7.3, BUTTON_DOWN, -2.6]}
        ref={rightButtonRef}
        onPointerEnter={() => (rightButtonHoverRef.current = true)}
        onPointerLeave={() => (rightButtonHoverRef.current = false)}
        scale={[0.2, 0.2, 0.2]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      >
        <ShoulderButtonPrimitive />
        <Material isButton />
      </mesh>
    </>
  )
}

const Material = ({ isButton = false }: { isButton?: boolean }) => {
  const { colour } = useRecoilValue(PocketSyncConfigSelector)
  return (
    <meshPhysicalMaterial
      attach="material"
      ior={isButton ? 1.4 : 1.74}
      color={BODY_COLOUR[colour]}
      clearcoat={isButton ? 0.25 : 0.1}
      clearcoatRoughness={isButton ? 0.8 : 1}
      emissive={BODY_COLOUR[colour]}
      emissiveIntensity={colour === "glow" ? 1.5 : 0}
      toneMapped={colour !== "glow"}
      envMapIntensity={0}
    />
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

const BoardImage = () => {
  const img = useLoader(TextureLoader, boardImg)
  return (
    <mesh position={[0, 0, -0.1]}>
      <planeGeometry args={[17, 30, 1, 1]} />
      <meshBasicMaterial
        attach="material"
        map={img}
        side={DoubleSide}
        alphaTest={0.5}
        // transparent
      />
    </mesh>
  )
}

const TransparentMaterial = ({ isButton = false }: { isButton?: boolean }) => {
  const { colour } = useRecoilValue(PocketSyncConfigSelector)
  return (
    <meshPhysicalMaterial
      attach="material"
      transmission={0.975}
      opacity={1}
      roughness={0.2}
      color="rgb(210,180,255)"
      ior={1.46}
      clearcoat={1}
      clearcoatRoughness={1}
      transparent
      side={DoubleSide}
    />
  )
}
