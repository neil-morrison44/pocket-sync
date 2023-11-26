import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { ShaderMaterial, Vector2 } from "three"

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;  // Pass the UV coordinates to the fragment shader
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const blackAndWhiteFragmentShader = `
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float threshold(float value, float thresholdValue) {
  return step(thresholdValue, value);
}

void main() {
  vec2 st = vUv;  // Use the varying UV coordinates instead of gl_FragCoord

  // Scale the coordinate system by the plane size
  st *= u_resolution.xy;
  st *= 0.5;

  vec2 ipos = floor(st);  // get the integer coords
  vec2 fpos = fract(st);  // get the fractional coords

  float rnd = random(ipos * sin(u_time));

  float thresholdValue = 0.5;
  float roundedValue = threshold(rnd, thresholdValue);

  gl_FragColor = vec4(vec3(roundedValue), 1.0);
}
`

const gameboyStyleFragmentShader = `
varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;

vec3 colorPalette[4] = vec3[4](
  vec3(0.529, 0.808, 0.922),  // Lightest green
  vec3(0.122, 0.682, 0.376),  // Medium green
  vec3(0.051, 0.478, 0.184),  // Dark green
  vec3(0.004, 0.271, 0.075)   // Darkest green
);

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Threshold function to round the value to 0 or 1
float threshold(float value, float thresholdValue) {
  return step(thresholdValue, value);
}

void main() {
  vec2 st = vUv;  // Use the varying UV coordinates passed from the vertex shader

  // Scale the coordinate system by the plane size
  st *= u_resolution.xy;
  st *= 0.1;

  vec2 ipos = floor(st);  // get the integer coords
  vec2 fpos = fract(st);  // get the fractional coords

  float rnd = random(ipos * sin(u_time * u_time));

  // Map the rounded value to the corresponding color from the palette
  vec3 color = colorPalette[int(rnd * 3.0)];

  gl_FragColor = vec4(color, 1.0);
}
`

type StaticScreenProps = { mode?: "GAMEBOY" | "BLACK_AND_WHITE" }

export const StaticScreen = ({
  mode = "BLACK_AND_WHITE",
}: StaticScreenProps) => {
  const shaderMaterialRef = useRef<ShaderMaterial>(null)
  const frameCount = useRef<number>(0)

  useEffect(() => {
    if (!shaderMaterialRef.current) return
    shaderMaterialRef.current.uniforms.u_resolution = {
      value: new Vector2(160, 144),
    }
  }, [])

  const uniforms = useMemo(
    () => ({
      u_resolution: { value: new Vector2(160, 144) },
      u_time: { value: 0.01 },
    }),
    []
  )

  useFrame(({ clock, ..._rest }) => {
    frameCount.current += 1
    if (frameCount.current % 5 !== 0) return
    frameCount.current = 0
    if (!shaderMaterialRef.current) return
    shaderMaterialRef.current.uniforms.u_time = {
      value: clock.getElapsedTime(),
    }
  })

  return (
    <shaderMaterial
      ref={shaderMaterialRef}
      attach="material"
      vertexShader={vertexShader}
      fragmentShader={
        {
          GAMEBOY: gameboyStyleFragmentShader,
          BLACK_AND_WHITE: blackAndWhiteFragmentShader,
        }[mode]
      }
      uniforms={uniforms}
    />
  )
}
