import { Float, type FloatProps } from "@react-three/drei"
import { useLayoutEffect, useRef } from "react"
import { Group } from "three"

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
export const UikitSafeFloat = (props: FloatProps) => {
  const innerRef = useRef<Group>(null)
  useLayoutEffect(() => {
    if (innerRef.current) innerRef.current.matrixAutoUpdate = true
  }, [])
  return <Float ref={innerRef} {...props} />
}

export const GLITTER_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const DISC_VERTEX = /* glsl */ `
  varying vec3 vLocalPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vRadialView;
  varying vec3 vFaceNormalView;

  void main() {
    vLocalPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    // View-space directions (anchor the fans to the camera, so they respond to
    // BOTH model rotation (the app's Float tumble) and camera orbit (the story's
    // OrbitControls). normalMatrix = the modelView normal matrix, already in view space.
    vec3 radial = vec3(position.x, 0.0, position.z);
    if (dot(radial, radial) < 1e-8) radial = vec3(0.0, 0.0, 1.0);
    vRadialView = normalize(normalMatrix * radial);
    // The disc's true face normal (local cylinder axis +Y) in view space.
    vFaceNormalView = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

export const DISC_FRAGMENT = /* glsl */ `
  varying vec3 vLocalPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vRadialView;
  varying vec3 vFaceNormalView;

  // HSV -> RGB (cheap, no sin/cos).
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  // Unit vector in the disc plane along the screen axis ref (the in-plane part
  // of ref). Falls back to alt when ref is parallel to the face normal
  // (disc edge-on), where the projection degenerates to zero.
  vec3 inPlane(vec3 N, vec3 ref, vec3 alt) {
    vec3 p = ref - dot(ref, N) * N;
    if (dot(p, p) < 1e-8) p = alt - dot(alt, N) * N;
    return normalize(p);
  }

  void main() {
    float conic = atan(vLocalPos.z, vLocalPos.x);   // -PI..PI, object space

    // --- Dynamic fan axis (view-anchored) --------------------------------
    // N is the disc's face normal in CAMERA space (constant across the disc).
    vec3 N = normalize(vFaceNormalView);

    // How "downwards" the face points in the view: 0 facing the camera, +1
    // facing down, -1 facing up. Drives both the fan-axis sweep and the hue shift.
    float tilt = asin(clamp(-N.y, -1.0, 1.0));      // -PI/2 .. PI/2

    // In-plane (view-space) basis anchored to the view axes: eRight ~ view +X
    // (left/right), eTop ~ the in-plane perpendicular (top/bottom when flat).
    // The fan axis sweeps from eTop (disc flat) to eRight (disc facing down).
    vec3 eRight = inPlane(N, vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    vec3 eTop   = normalize(cross(N, eRight));
    vec3 fanAxis = eRight * sin(tilt) + eTop * cos(tilt);   // unit, in-plane

    // Hue wheel (object space, spins with the disc) + a tilt-driven hue shift so
    // the palette cycles as the disc faces down. Time-free, by design.
    float hue     = fract(conic / 6.2831853 + tilt * 0.25);
    vec3 rainbow  = hsv2rgb(vec3(hue, 0.85, 1.0));

    float align = dot(normalize(vRadialView), fanAxis);
    float gate  = pow(clamp(abs(align), 0.0, 1.0), 8.0);

    // Radial position in local units (rim ~0.772, hole ~0.15).
    float rn = length(vLocalPos.xz) / 0.772;

    // The hub: a darker band around the central hole (see reference images),
    // dark just outside the hole and fading out by rn ~0.45.
    float hubMask = 1.0 - smoothstep(0.15, 0.45, rn);
    // A sharper circular edge at the hub's outer boundary, in addition to the
    // fade — the crisp rim visible in the reference images.
    float edgeMask = 1.0 - smoothstep(0.0, 0.018, abs(rn - 0.25));

    // Fade the rainbow out over the hub (and its edge) so both read cleanly.
    gate *= 1.0 - max(hubMask, edgeMask);

    float streak = 0.82 + 0.18 * sin(conic * 220.0);

    // Base silver: brightened grey body, darkened over the hub band, + a fixed
    // world light spec + a bright rim where the surface goes edge-on.
    vec3 V    = normalize(cameraPosition - vWorldPos);
    vec3 Nf   = normalize(vWorldNormal);
    float NdV = clamp(dot(Nf, V), 0.0, 1.0);
    vec3 body    = mix(vec3(0.29), vec3(0.39), NdV);
    vec3 hubGrey = mix(vec3(0.05), vec3(0.12), NdV);
    vec3 grey    = mix(body, hubGrey, hubMask);
    // The sharper edge: a distinct, slightly darker line at the hub's boundary.
    grey = mix(grey, vec3(0.03), edgeMask * 0.7);
    vec3 Ls      = normalize(vec3(-0.35, 0.5, 0.85));
    float spec   = pow(clamp(dot(Nf, normalize(Ls + V)), 0.0, 1.0), 160.0);
    float rim    = pow(1.0 - NdV, 3.0);
    vec3 base    = grey + spec * 0.6 + rim * 0.12;

    vec3 fan = rainbow * (0.9 + 0.25 * streak);
    gl_FragColor = vec4(mix(base, fan, gate), 1.0);
  }
`

// A constant left-to-right "stream of glitter" used as the background of the
// progress bar. The download item (the "spaceship") flies through it; its
// horizontal position is what indicates current progress.
export const GLITTER_FRAGMENT = /* glsl */ `
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
  // Velocities are symmetric around BASE_SPEED so no two dots move or blink in
  // lock-step — which removes the old visible grid and the sweeping blink bands.
  //
  // Suck-in: dots accelerate through the end of the bar as if the Pocket is
  // drawing them in. Two independent knobs to tune:
  //   SUCK_K       strength — peak speed multiplier at the very edge = 1 + SUCK_K
  //   SUCK_REGION  how much of the bar's length (from the right) gets sped up
  //                (0.20 = last 20%, 0.30 = last 30%)
  #define ROWS 12.0
  #define DOTS_PER_ROW 12.0
  #define BASE_SPEED 0.16
  #define SUCK_K 4.0
  #define SUCK_REGION 0.33

  void main() {
    vec2 uv = vUv;

    // Soft vertical "tube" envelope: bright at the vertical centre, fading to edges.
    float edge = abs(uv.y - 0.5) * 2.0;             // 0 centre -> 1 edge
    float tube = pow(1.0 - smoothstep(0.0, 1.0, edge), 1.2);

    // Fade in at the left (start) and out at the right (end).
    float xfade = smoothstep(0.0, 0.18, uv.x) * (1.0 - smoothstep(0.82, 1.0, uv.x));

    // Suck-in math (all derived from SUCK_K / SUCK_REGION above):
    //   sqk    = sqrt(SUCK_K)
    //   suckB  = where the acceleration starts (x = 1 - SUCK_REGION)
    //   suckS  = length of the accelerating region (= SUCK_REGION)
    //   s1     = total "S-progress" per full traversal, so the wrap stays seamless
    float sqk = sqrt(SUCK_K);
    float suckB = 1.0 - SUCK_REGION;
    float suckS = SUCK_REGION;
    float s1 = suckB + (suckS / sqk) * atan(sqk);

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

          // Per-dot base velocity, symmetric around BASE_SPEED (mean preserved).
          float vDot = BASE_SPEED * (0.65 + 0.7 * rSpeed);   // ~0.65x .. 1.35x

          // Starting x: a random offset within each even slot — de-gridifies the
          // initial layout immediately.
          float x0 = (fi + rX) / DOTS_PER_ROW;

          // Current x: constant speed up to suckB, then accelerating through the
          // last SUCK_REGION of the bar (the "suck-in"). The per-dot speed is folded
          // into the traversal length (s1) so the wrap stays seamless.
          float q = fract((x0 + vDot * uTime) / s1);
          float W = q * s1;
          float dx;
          if (W <= suckB) {
            dx = W;
          } else {
            dx = suckB + (suckS / sqk) * tan((sqk / suckS) * (W - suckB));
          }

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
