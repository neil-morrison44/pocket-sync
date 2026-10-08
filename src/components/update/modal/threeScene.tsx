import { Lights, Body as PocketBody } from "../../three/pocket"
import { Float, PerspectiveCamera } from "@react-three/drei"
import {
  Root,
  Fullscreen,
  Container,
  Content,
  Text,
  Svg,
} from "@react-three/uikit"
import { Suspense } from "react"
import { PocketEnv } from "../../three/env"
import { ColourContextProviderFromConfig } from "../../three/colourContext"
import { DownloadItemsModel } from "./downloadItemsModel"
import { CoreLogoScreen } from "../../three/coreLogoScreen"
import { StaticScreen } from "../../three/staticScreen"

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

  return (
    <>
      <Lights />
      <Suspense>
        <PocketEnv />
      </Suspense>

      <Fullscreen flexDirection="row" justifyContent="center" height="220px">
        <Container flexGrow={0} flexDirection="row" flexBasis="100%">
          <Container flexGrow={1} alignItems="center">
            {progress && (
              <>
                <Container flexGrow={clampedPosition} />
                <Suspense>
                  <Content
                    height="50%"
                    alignItems="center"
                    opacity={Math.max(
                      0,
                      Math.min(1, (1 - clampedPosition) * 5)
                    )}
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
                </Suspense>
                <Container flexGrow={1 - clampedPosition} />
              </>
            )}
          </Container>
          <Container flexGrow={0} flexDirection="row" flexBasis="10%" />
        </Container>
      </Fullscreen>

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
                      <Suspense fallback={<StaticScreen />}>
                        {coreName ? (
                          <CoreLogoScreen coreName={coreName} />
                        ) : null}
                      </Suspense>
                    }
                  />
                </group>
              </ColourContextProviderFromConfig>
            </Content>
          </Container>
          <Container flexGrow={0} flexDirection="row" flexBasis="10%" />
        </Container>
      </Fullscreen>
    </>
  )
}
