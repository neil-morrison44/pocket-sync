import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, RoundedBox } from "@react-three/drei"
import { ReactNode, useRef } from "react"
import { useRecoilValue } from "recoil"
import { PocketSyncConfigSelector } from "../../recoil/config/selectors"

import "./index.css"
import { DoubleSide, Group, MathUtils, Mesh } from "three"
import { Bloom, EffectComposer } from "@react-three/postprocessing"
import { KernelSize } from "postprocessing"

import envMap from "./studio_small_08_1k.hdr"

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
      camera={{ fov: 50, position: [0, 0, 42] }}
    >
      <Environment files={envMap} />
      <Lights />
      <Body move={move} screenMaterial={screenMaterial} />
      {/* <OrbitControls enablePan={false} /> */}
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
      <RoundedBox
        args={[0.86 * 20, 1.49 * 20, 0.11 * 20]}
        radius={1}
        receiveShadow
      >
        <Material />
      </RoundedBox>
      <RoundedBox
        castShadow
        receiveShadow
        args={[0.86 * 20, 1.49 * 12.5, 0.22 * 20]}
        radius={1}
        position={[0, -11 / 2, -1.2]}
      >
        <Material />
      </RoundedBox>

      <Buttons />
      <DPAD />
      <BottomButtons />
      <ShoulderButtons />

      <Screen screenMaterial={screenMaterial} />

      <mesh position={[-8.2, 12, 1.11]}>
        <RoundedBox
          castShadow
          receiveShadow
          args={[1.5, 3, 1]}
          radius={0.5}
          position={[0, -11 / 2, -1]}
        >
          <meshBasicMaterial attach="material" color="rgb(88, 144, 80)" />
        </RoundedBox>
      </mesh>
    </group>
  )
}

const Screen = ({ screenMaterial }: PocketProps) => {
  const { colour } = useRecoilValue(PocketSyncConfigSelector)
  return (
    <>
      {/* colour */}
      <mesh position={[0, 7.5, 1.11]}>
        <planeGeometry attach="geometry" args={[16, 14]} />
        <meshPhysicalMaterial
          ior={1.46}
          color={colour === "white" ? "rgb(222,222,220)" : "black"}
        />
      </mesh>

      {/* LCD */}
      <mesh position={[0, 7.5, 1.12]}>
        <planeGeometry attach="geometry" args={[160 / 13, 140 / 13]} />
        {screenMaterial || (
          <meshPhongMaterial attach="material" color="green" />
        )}
      </mesh>
      {/* Glass */}
      <mesh position={[0, 7.5, 1.13]}>
        <planeGeometry attach="geometry" args={[160 / 10, 140 / 10]} />
        <meshPhysicalMaterial
          thickness={0.1}
          roughness={0}
          transmission={1}
          color="white"
          ior={1.46}
          clearcoat={0.1}
          clearcoatRoughness={1}
          opacity={0.4}
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
      position={[4, -3, 1.25]}
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
        >
          <cylinderGeometry attach="geometry" args={[0.9, 0.9, 1, 16]} />
          <Material isButton />
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
      position={[0, -10, 1.25]}
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
          <cylinderGeometry attach="geometry" args={[0.5, 0.5, 0.5, 16]} />
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
      position={[-4, -3, 1.25]}
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
        {args.map((a, index) => (
          <mesh key={index} castShadow receiveShadow>
            {/* @ts-ignore */}
            <boxGeometry args={a} />
            <Material isButton />
          </mesh>
        ))}
      </group>
    </group>
  )
}

const ShoulderButtons = () => {
  const leftButtonRef = useRef<Mesh>(null)
  const leftButtonHoverRef = useRef(false)

  const rightButtonRef = useRef<Mesh>(null)
  const rightButtonHoverRef = useRef(false)

  useFrame(() => {
    if (leftButtonRef.current) {
      if (leftButtonHoverRef.current) {
        leftButtonRef.current.position.y = MathUtils.lerp(
          leftButtonRef.current.position.y,
          3.25,
          0.25
        )
      } else {
        leftButtonRef.current.position.y = MathUtils.lerp(
          leftButtonRef.current.position.y,
          3.5,
          0.25
        )
      }
    }

    if (rightButtonRef.current) {
      if (rightButtonHoverRef.current) {
        rightButtonRef.current.position.y = MathUtils.lerp(
          rightButtonRef.current.position.y,
          3.25,
          0.25
        )
      } else {
        rightButtonRef.current.position.y = MathUtils.lerp(
          rightButtonRef.current.position.y,
          3.5,
          0.25
        )
      }
    }
  })

  return (
    <>
      <mesh
        position={[-7.4, 3.5, -2]}
        ref={leftButtonRef}
        onPointerEnter={() => (leftButtonHoverRef.current = true)}
        onPointerLeave={() => (leftButtonHoverRef.current = false)}
      >
        <RoundedBox
          castShadow
          receiveShadow
          args={[3, 1.5, 2.5]}
          radius={0.5}
          position={[0, 0, 0]}
        >
          <Material isButton />
        </RoundedBox>
      </mesh>
      <mesh
        position={[7.4, 3.5, -2]}
        ref={rightButtonRef}
        onPointerEnter={() => (rightButtonHoverRef.current = true)}
        onPointerLeave={() => (rightButtonHoverRef.current = false)}
      >
        <RoundedBox
          castShadow
          receiveShadow
          args={[3, 1.5, 2.5]}
          radius={0.5}
          position={[0, 0, 0]}
        >
          <Material isButton />
        </RoundedBox>
      </mesh>
    </>
  )
}

const Material = ({ isButton = false }: { isButton?: boolean }) => {
  const { colour } = useRecoilValue(PocketSyncConfigSelector)
  return (
    <meshPhysicalMaterial
      attach="material"
      ior={isButton ? 1.4 : 1.34}
      color={BODY_COLOUR[colour]}
      clearcoat={isButton ? 0.25 : 0}
      clearcoatRoughness={isButton ? 0.8 : 0}
      emissive={BODY_COLOUR[colour]}
      emissiveIntensity={colour === "glow" ? 1.5 : 0}
      toneMapped={colour !== "glow"}
      envMapIntensity={0}
    />
  )
}
