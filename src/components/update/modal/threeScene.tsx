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
import { MathUtils } from "three"

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
  const clampedPosition = Math.max(0, Math.min(1, progress ?? 0))
  const [smoothProgress, setSmoothProgress] = useState(clampedPosition)
  const currentProgressRef = useRef(clampedPosition)

  useFrame((_, delta) => {
    if (clampedPosition > currentProgressRef.current) {
      currentProgressRef.current = MathUtils.damp(
        currentProgressRef.current,
        clampedPosition,
        8,
        delta
      )
    } else {
      currentProgressRef.current = clampedPosition
    }
    setSmoothProgress(currentProgressRef.current)
  })

  return (
    <>
      <Suspense>
        <Lights />
        <PocketEnv />
      </Suspense>
      <Suspense>
        <Fullscreen flexDirection="row" justifyContent="center" height="220px">
          <Container flexGrow={1} alignItems="center">
            {progress !== undefined && (
              <>
                <Container flexGrow={smoothProgress} />
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
                <Container flexGrow={1 - smoothProgress} />
              </>
            )}
          </Container>
          <Container flexGrow={0} flexDirection="row" flexBasis="10%" />
        </Fullscreen>
      </Suspense>

      <Suspense>
        <Fullscreen flexDirection="row" justifyContent="center" height="220px">
          <Container flexGrow={0} flexDirection="row" flexBasis="100%">
            <Container flexGrow={1} alignItems="center"></Container>
            <Container>
              <Content width="auto" height="100%">
                <ColourContextProviderFromConfig>
                  <group scale={5} rotation={[0, -0.5, 0]}>
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
