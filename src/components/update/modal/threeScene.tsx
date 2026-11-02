import { Lights, Body as PocketBody } from "../../three/pocket"
import {
  Fullscreen,
  Container,
  Content,
  Custom,
  type VanillaContainer,
  type VanillaContent,
} from "@react-three/uikit"
import { Suspense, useMemo, useRef } from "react"
import { PocketEnv } from "../../three/env"
import { ColourContextProviderFromConfig } from "../../three/colourContext"
import { DownloadItemsModel } from "./downloadItemsModel"
import { CoreLogoScreen } from "../../three/coreLogoScreen"
import { StaticScreen } from "../../three/staticScreen"
import { useFrame } from "@react-three/fiber"
import { MathUtils, type ShaderMaterial } from "three"
import {
  UikitSafeFloat,
  GLITTER_VERTEX,
  GLITTER_FRAGMENT,
} from "./threeScene.helpers"

const AnimatedProgress = ({
  progress,
  loadingModel,
}: {
  progress?: number
  loadingModel: "Arcade" | "Chip" | "Disk"
}) => {
  const clampedPosition = Math.max(0, Math.min(1, progress ?? 0))

  const currentProgressRef = useRef(0)
  const glitterMaterialRef = useRef<ShaderMaterial>(null)
  const glitterUniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  // Imperative uikit refs: drive flexGrow/opacity via setProperties each frame
  // instead of React state, so the uikit subtree doesn't re-render (and
  // re-measure) on every frame.
  const leftSpacerRef = useRef<VanillaContainer>(null)
  const rightSpacerRef = useRef<VanillaContainer>(null)
  const itemContentRef = useRef<VanillaContent>(null)

  useFrame((state, delta) => {
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

    const smoothProgress = currentProgressRef.current
    if (leftSpacerRef.current) {
      leftSpacerRef.current.setProperties({ flexGrow: smoothProgress })
    }
    if (rightSpacerRef.current) {
      rightSpacerRef.current.setProperties({ flexGrow: 1 - smoothProgress })
    }
    if (itemContentRef.current) {
      itemContentRef.current.setProperties({
        opacity: Math.max(0, Math.min(1, (1 - smoothProgress) * 5)),
      })
    }

    if (glitterMaterialRef.current) {
      glitterMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <Container width="100%" height="100%" positionType="relative">
      {/* Glitter "tube": full-width band the download item flies through. Sized
          a little taller than the pocket so it reads as the backdrop. */}
      <Custom
        positionType="absolute"
        width="100%"
        height="100%"
        positionLeft="0%"
        positionTop="0%"
        transformTranslateZ={-1}
        renderOrder={-10}
      >
        <shaderMaterial
          ref={glitterMaterialRef}
          transparent
          depthWrite={false}
          uniforms={glitterUniforms}
          vertexShader={GLITTER_VERTEX}
          fragmentShader={GLITTER_FRAGMENT}
        />
      </Custom>

      {/* Download item slides left -> right as progress advances. */}
      <Container
        width="100%"
        height="100%"
        flexDirection="row"
        alignItems="center"
      >
        <Container ref={leftSpacerRef} flexGrow={0} flexBasis={0} />
        <Content
          ref={itemContentRef}
          height="46%"
          alignItems="center"
          opacity={1}
        >
          <UikitSafeFloat
            speed={2}
            rotationIntensity={2}
            floatIntensity={0.75}
            floatingRange={[-0.2, 0.2]}
          >
            <DownloadItemsModel model={loadingModel} />
          </UikitSafeFloat>
        </Content>
        <Container ref={rightSpacerRef} flexBasis={0} flexGrow={1} />
      </Container>
    </Container>
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
  const pocket = (
    <group scale={5} rotation={[0, -0.5, 0]}>
      <UikitSafeFloat
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
      </UikitSafeFloat>
    </group>
  )

  return (
    <>
      <Suspense>
        <Lights />
        <PocketEnv />
      </Suspense>

      <Fullscreen flexDirection="row" justifyContent="center" height="300px">
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
                  {pocket}
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
