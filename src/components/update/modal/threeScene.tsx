import { Lights, Body as PocketBody } from "../../three/pocket"
import { Float } from "@react-three/drei"
import { Fullscreen, Container, Content } from "@react-three/uikit"
import { Suspense, useRef, useState } from "react"
import { PocketEnv } from "../../three/env"
import { ColourContextProviderFromConfig } from "../../three/colourContext"
import { DownloadItemsModel } from "./downloadItemsModel"
import { CoreLogoScreen } from "../../three/coreLogoScreen"
import { StaticScreen } from "../../three/staticScreen"
import { useFrame } from "@react-three/fiber"
import { MathUtils, ShaderMaterial } from "three"

const AnimatedProgress = ({
  progress,
  loadingModel,
}: {
  progress?: number
  loadingModel: "Arcade" | "Chip" | "Disk"
}) => {
  const clampedPosition = Math.max(0, Math.min(1, progress ?? 0))

  const [smoothProgress, setSmoothProgress] = useState(0)
  const currentProgressRef = useRef(0)

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.1)

    if (clampedPosition > currentProgressRef.current) {
      currentProgressRef.current = MathUtils.damp(
        currentProgressRef.current,
        clampedPosition,
        8,
        safeDelta
      )
    } else {
      currentProgressRef.current = clampedPosition
    }
    setSmoothProgress(currentProgressRef.current)
  })

  return (
    <>
      <Container flexGrow={smoothProgress} flexBasis={0} />
      <Content
        height="50%"
        alignItems="center"
        opacity={Math.max(0, Math.min(1, (1 - smoothProgress) * 5))}
      >
        <Float
          speed={2}
          rotationIntensity={2}
          floatIntensity={0.75}
          floatingRange={[-0.2, 0.2]}
        >
          <DownloadItemsModel model={loadingModel} />
        </Float>
      </Content>
      <Container flexBasis={0} flexGrow={1 - smoothProgress} />
    </>
  )
}

type UpdateThreeSceneProps = {
  progress?: number
  coreName?: string
  loadingModel?: "Arcade" | "Chip" | "Disk"
}

export const UpdateThreeScene = ({
  progress,
  coreName,
  loadingModel = "Chip",
}: UpdateThreeSceneProps) => {
  return (
    <>
      <Suspense>
        <Lights />
        <PocketEnv />
      </Suspense>

      <Fullscreen flexDirection="row" justifyContent="center" height="220px">
        <Container flexGrow={1} alignItems="center" flexDirection="row">
          {progress !== undefined && (
            <Suspense fallback={null}>
              <AnimatedProgress
                progress={progress}
                loadingModel={loadingModel}
              />
            </Suspense>
          )}
        </Container>
        <Container flexGrow={0} flexDirection="row" flexBasis="10%" />
      </Fullscreen>

      <Suspense>
        <Fullscreen flexDirection="row" justifyContent="center" height="220px">
          <Container flexGrow={0} flexDirection="row" flexBasis="100%">
            <Container flexGrow={1} alignItems="center"></Container>
            <Container>
              <Content width="auto" height="100%">
                <ColourContextProviderFromConfig>
                  <group scale={5} rotation={[0, -0.5, 0]}>
                    <Float
                      speed={0.5}
                      rotationIntensity={1.5}
                      floatIntensity={0.75}
                      floatingRange={[-0.2, 0.2]}
                    >
                      <PocketBody
                        jauntyAngle={false}
                        screenMaterial={
                          coreName ? (
                            <Suspense fallback={<StaticScreen />}>
                              <CoreLogoScreen coreName={coreName} />
                            </Suspense>
                          ) : null
                        }
                      />
                    </Float>
                  </group>
                </ColourContextProviderFromConfig>
              </Content>
            </Container>
            <Container flexGrow={0} flexDirection="row" flexBasis="10%" />
          </Container>
        </Fullscreen>
      </Suspense>
    </>
  )
}

const sharedUniforms = {
  uTime: { value: 0 },
}

// 2. Define the custom Material Class extending THREE.ShaderMaterial
class GlitterMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: sharedUniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;

        // Pseudo-random noise function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        void main() {
          vec2 uv = vUv;
          // Travel to the right over time
          uv.x -= uTime * 0.05;

          // Create a grid for the glitter flakes
          vec2 grid = floor(uv * vec2(300.0, 50.0));
          float rand = random(grid);

          // Twinkle effect using sine waves offset by the random value
          float twinkle = sin(uTime * 4.0 + rand * 10.0) * 0.5 + 0.5;

          // Threshold to only show the brightest spots (sparse glitter)
          float glitter = step(0.97, rand) * twinkle;

          gl_FragColor = vec4(vec3(1.0), glitter * 0.8);
        }
      `,
    })
  }
}
