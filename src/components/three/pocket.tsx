import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stats, RoundedBox } from "@react-three/drei"
import { ReactNode, useRef } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { PocketModelColourAtom } from "../../recoil/atoms"

import "./index.css"

type PocketProps = {
  spin?: boolean
  show?: "screenshots" | "static"
  colour?: "black" | "white"
  screenMaterial?: ReactNode
}

const BLACK_COLOUR = "rgb(0,0,0)"
const WHITE_COLOUR = "rgb(220,220,220)"

export const Pocket = ({
  spin = false,
  show = "static",
  colour = "black",
  screenMaterial,
}: PocketProps) => {
  return (
    <Canvas shadows className="three-pocket">
      <ambientLight />
      <pointLight position={[10, 10, 10]} intensity={4} />
      <directionalLight position={[10, 10, 10]} intensity={5} castShadow />
      <directionalLight position={[5, 0, 5]} intensity={3} castShadow />

      <directionalLight position={[-10, -10, 5]} intensity={1} castShadow />
      <Body spin={spin} screenMaterial={screenMaterial} />
      {/* <OrbitControls maxDistance={4} minDistance={3} enablePan={false} /> */}
      {/* <Stats /> */}
    </Canvas>
  )
}

const Body = ({
  spin,
  screenMaterial,
}: Pick<PocketProps, "spin" | "screenMaterial">) => {
  const groupRef = useRef<THREE.Group>(null)
  const changeColour = useSetRecoilState(PocketModelColourAtom)
  useFrame((_, delta) => {
    if (groupRef.current && spin) {
      groupRef.current.rotateY(-0.6 * delta)
    }
  })

  return (
    <group
      ref={groupRef}
      rotation={[0, 0, -0.2]}
      // onClick={() =>
      //   changeColour((col) => {
      //     if (col === "black") return "white"
      //     return "black"
      //   })
      // }
    >
      <RoundedBox
        args={[0.86 * 2, 1.49 * 2, 0.11 * 2]}
        radius={0.1}
        receiveShadow
      >
        <Material />
      </RoundedBox>
      <RoundedBox
        castShadow
        receiveShadow
        args={[0.86 * 2, 1.49 * 1.25, 0.22 * 2]}
        radius={0.1}
        position={[0, -1.1 / 2, -0.12]}
      >
        <Material />
      </RoundedBox>

      <Buttons />
      <DPAD />
      <BottomButtons />

      <mesh position={[0, 0.75, 0.111]}>
        <planeGeometry attach="geometry" args={[160 / 130, 140 / 130]} />
        {screenMaterial || (
          <meshPhongMaterial attach="material" color="green" />
        )}
      </mesh>

      <mesh position={[0, 0.75, 0.12]}>
        <planeGeometry attach="geometry" args={[160 / 100, 140 / 100]} />
        <meshPhysicalMaterial
          thickness={0}
          roughness={0}
          transmission={1}
          color="white"
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      <mesh position={[-0.82, 1.2, 0.111]}>
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.15, 0.3, 0.1]}
          radius={0.05}
          position={[0, -1.1 / 2, -0.12]}
        >
          <meshBasicMaterial attach="material" color="rgb(88, 144, 80)" />
        </RoundedBox>
      </mesh>
    </group>
  )
}

const BUTTON_GAP = 0.125 as const

const Buttons = () => {
  const positions = [
    [BUTTON_GAP, 0, BUTTON_GAP],
    [-BUTTON_GAP, 0, BUTTON_GAP],
    [-BUTTON_GAP, 0, -BUTTON_GAP],
    [BUTTON_GAP, 0, -BUTTON_GAP],
  ] as const

  return (
    <group
      position={[0.4, -0.3, 0.125]}
      rotation={[Math.PI / 2, Math.PI / 4, 0]}
      castShadow
      receiveShadow
    >
      {positions.map((p, index) => (
        <mesh position={p} key={index} castShadow receiveShadow>
          <cylinderGeometry attach="geometry" args={[0.09, 0.09, 0.1, 16]} />
          <Material />
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
      position={[0, -1, 0.125]}
      rotation={[Math.PI / 2, Math.PI / 4, 0]}
      castShadow
      receiveShadow
    >
      {positions.map((p, index) => (
        <mesh position={p} key={index} castShadow receiveShadow>
          <cylinderGeometry attach="geometry" args={[0.05, 0.05, 0.05, 16]} />
          <Material />
        </mesh>
      ))}
    </group>
  )
}

const DPAD = () => {
  const args = [
    [BUTTON_GAP, 0.1, BUTTON_GAP * 3.5],
    [BUTTON_GAP * 3.5, 0.1, BUTTON_GAP],
  ] as const

  return (
    <group
      position={[-0.4, -0.3, 0.125]}
      rotation={[Math.PI / 2, 0, 0]}
      castShadow
      receiveShadow
    >
      {args.map((a, index) => (
        <mesh key={index} castShadow receiveShadow>
          <boxGeometry args={a} />
          <Material />
        </mesh>
      ))}
    </group>
  )
}

const Material = () => {
  const colour = useRecoilValue(PocketModelColourAtom)
  return (
    <meshPhysicalMaterial
      attach="material"
      roughness={0.95}
      transmission={0}
      clearcoat={0}
      ior={1.25}
      color={colour == "black" ? BLACK_COLOUR : WHITE_COLOUR}
    />
  )
}
