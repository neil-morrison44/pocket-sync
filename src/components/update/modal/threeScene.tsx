import { Lights, Body as PocketBody } from "../../three/pocket"
import { Float, type FloatProps } from "@react-three/drei"
import { Fullscreen, Container, Content, Custom } from "@react-three/uikit"
import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react"
import { PocketEnv } from "../../three/env"
import { ColourContextProviderFromConfig } from "../../three/colourContext"
import { DownloadItemsModel } from "./downloadItemsModel"
import { CoreLogoScreen } from "../../three/coreLogoScreen"
import { StaticScreen } from "../../three/staticScreen"
import { useFrame } from "@react-three/fiber"
import { MathUtils, Group, type ShaderMaterial } from "three"

/**
 * drei's `Float` renders its inner (animated) group with `matrixAutoUpdate={false}`.
 * uikit's `Content` measures its children with `Box3.expandByObject`, which calls
 * `updateWorldMatrix(false, false)` — that can NOT recompute `matrixWorld` for a
 * node with `matrixAutoUpdate: false` (force is always false), so if a render frame
 * has already baked uikit's scaled-down world transform, the measurement captures the
 * stale world-frame matrix → cached box ~100× too small → `childrenMatrix` scale ~100×
 * too big (the "giant model" flake). Flipping the flag on the inner group makes the
 * measurement deterministic (always local frame) while keeping rendering identical
 * (the matrix is recomposed from the same position/quaternion/scale every frame).
 * drei's `Float` forwards its ref to exactly this inner group.
 */
const UikitSafeFloat = (props: FloatProps) => {
  const innerRef = useRef<Group>(null)
  useLayoutEffect(() => {
    if (innerRef.current) innerRef.current.matrixAutoUpdate = true
  }, [])
  return <Float ref={innerRef} {...props} />
}

const GLITTER_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// A constant left-to-right "stream of glitter" used as the background of the
// progress bar. The download item (the "spaceship") flies through it; its
// horizontal position is what indicates current progress.
const GLITTER_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  // Cheap 2D -> 1D hash (no sin). Good enough quality for per-dot randoms.
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Dots are laid out in a coarse grid of "rows", but each dot is an independent
  // particle: its own velocity, size, brightness and twinkle (frequency + phase).
  // Velocities are symmetric around BASE_SPEED so the overall flow speed (and its
  // average) is unchanged, yet no two dots move or blink in lock-step — which is
  // what removes the old visible grid and the sweeping blink bands.
  #define ROWS 12.0
  #define DOTS_PER_ROW 12.0
  #define BASE_SPEED 0.16

  void main() {
    vec2 uv = vUv;

    // Soft vertical "tube" envelope: bright at the vertical centre, fading to edges.
    float edge = abs(uv.y - 0.5) * 2.0;             // 0 centre -> 1 edge
    float tube = pow(1.0 - smoothstep(0.0, 1.0, edge), 1.2);

    // Fade in at the left (start) and out at the right (end).
    float xfade = smoothstep(0.0, 0.18, uv.x) * (1.0 - smoothstep(0.82, 1.0, uv.x));

    float rows = ROWS;
    float rowH = 1.0 / rows;
    float fragRow = floor(uv.y * rows);

    // Accumulate the brightness of every dot near this fragment (used for both the
    // intensity and the white tint, so hotspots read bright and slightly white).
    float glow = 0.0;

    for (int o = -1; o <= 1; o++) {
      float r = fragRow + float(o);
      if (r >= 0.0 && r < rows) {
        for (int i = 0; i < int(DOTS_PER_ROW); i++) {
          float fi = float(i);
          vec2 id = vec2(r, fi);

          float rSpeed  = hash21(id + 0.1);
          float rX      = hash21(id + 1.7);
          float rY      = hash21(id + 2.9);
          float rSize   = hash21(id + 4.3);
          float rBright = hash21(id + 5.8);
          float rPhase  = hash21(id + 7.4);
          float rFreq   = hash21(id + 9.6);

          // Per-dot velocity, symmetric around BASE_SPEED (mean preserved).
          float speed = BASE_SPEED * (0.65 + 0.7 * rSpeed);   // ~0.65x .. 1.35x

          // Starting x: a random offset within each even slot — de-gridifies the
          // initial layout immediately.
          float x0 = (fi + rX) / DOTS_PER_ROW;

          // Current x: flowing left -> right, wrapping around.
          float dx = fract(x0 + speed * uTime);

          // y: jittered within the row band so dots don't sit on exact rows.
          float dy = (r + 0.5 + (rY - 0.5) * 0.9) * rowH;

          // Normalised ellipse distance (taller in uv-y so dots read round on the
          // wide, short bar) -> soft circular dot.
          float rx = 0.0025 + 0.0035 * rSize;
          float ry = rx * 5.0;
          float dist = length(vec2((uv.x - dx) / rx, (uv.y - dy) / ry));
          float dot = smoothstep(1.0, 0.0, dist);

          // Twinkle: unique frequency + phase per dot, softened so dots never fully
          // disappear (subtle shimmer rather than a hard blink).
          float freq = 1.5 + rFreq * 3.0;              // ~1.5 .. 4.5
          float tw = 0.65 + 0.35 * sin(uTime * freq + rPhase * 62.83);

          float bright = 0.5 + 0.5 * rBright;
          glow += dot * tw * bright;
        }
      }
    }

    // Soft continuous band so the "tube" reads even between the sparkles.
    float band = 0.22 * tube;

    float intensity = (band + tube * (glow * 1.2)) * xfade;

    vec3 tint = mix(vec3(0.70, 0.82, 1.0), vec3(1.0), clamp(glow * 0.5, 0.0, 1.0));
    gl_FragColor = vec4(tint, intensity);
  }
`

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
  const glitterMaterialRef = useRef<ShaderMaterial>(null)
  const glitterUniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

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
    setSmoothProgress(currentProgressRef.current)

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
        <Container flexGrow={smoothProgress} flexBasis={0} />
        <Content
          height="46%"
          alignItems="center"
          opacity={Math.max(0, Math.min(1, (1 - smoothProgress) * 5))}
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
        <Container flexBasis={0} flexGrow={1 - smoothProgress} />
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
