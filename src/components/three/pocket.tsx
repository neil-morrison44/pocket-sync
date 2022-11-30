import { Canvas, useFrame } from "@react-three/fiber"
import { RoundedBox } from "@react-three/drei"
import { ReactNode, useRef } from "react"
import { useRecoilValue } from "recoil"

import "./index.css"
import { PocketSyncConfigSelector } from "../../recoil/selectors"

type PocketProps = {
  move?: "none" | "spin" | "back-and-forth"
  screenMaterial?: ReactNode
}

const BLACK_COLOUR = "rgb(1,1,1)"
const WHITE_COLOUR = "rgb(90,90,90)"

export const Pocket = ({ move = "none", screenMaterial }: PocketProps) => {
  return (
    <Canvas
      shadows
      className="three-pocket"
      camera={{ fov: 50, position: [0, 0, 42] }}
    >
      <ambientLight intensity={1.25} />
      <pointLight position={[20, 10, 20]} intensity={3} />
      <directionalLight position={[0, 100, 0]} intensity={5} castShadow />
      <directionalLight position={[80, 0, 80]} intensity={1.1} castShadow />

      <directionalLight position={[-100, -100, 50]} intensity={1.1} />
      <Body move={move} screenMaterial={screenMaterial} />
      {/* <OrbitControls maxDistance={4} minDistance={3} enablePan={false} /> */}
      {/* <Stats /> */}
    </Canvas>
  )
}

const Body = ({
  move,
  screenMaterial,
}: Pick<PocketProps, "move" | "screenMaterial">) => {
  const groupRef = useRef<THREE.Group>(null)
  const speedRef = useRef<number>(1)
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
            speedRef.current = 0.2
          } else if (groupRef.current.rotation.y < -0.4) {
            speedRef.current = -0.2
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
        <meshPhongMaterial color={colour === "black" ? "black" : "white"} />
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
          thickness={0}
          roughness={0}
          transmission={1}
          color="white"
          ior={1.46}
          clearcoat={1}
          clearcoatRoughness={0.1}
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

  return (
    <group
      position={[4, -3, 1.25]}
      rotation={[Math.PI / 2, Math.PI / 4, 0]}
      castShadow
      receiveShadow
    >
      {positions.map((p, index) => (
        <mesh position={p} key={index} castShadow receiveShadow>
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

  return (
    <group
      position={[0, -10, 1.25]}
      rotation={[Math.PI / 2, Math.PI / 4, 0]}
      castShadow
      receiveShadow
    >
      {positions.map((p, index) => (
        <mesh position={p} key={index} castShadow receiveShadow>
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

  return (
    <group
      position={[-4, -3, 1.25]}
      rotation={[Math.PI / 2, 0, 0]}
      castShadow
      receiveShadow
    >
      {args.map((a, index) => (
        <mesh key={index} castShadow receiveShadow>
          {/* @ts-ignore */}
          <boxGeometry args={a} />
          <Material isButton />
        </mesh>
      ))}
    </group>
  )
}

const Material = ({ isButton = false }: { isButton?: boolean }) => {
  const { colour } = useRecoilValue(PocketSyncConfigSelector)
  return (
    <meshPhysicalMaterial
      attach="material"
      ior={isButton ? 1.4 : 1.46}
      color={colour == "black" ? BLACK_COLOUR : WHITE_COLOUR}
      clearcoat={isButton ? 0.2 : undefined}
      clearcoatRoughness={isButton ? 0.8 : undefined}
    />
  )
}
