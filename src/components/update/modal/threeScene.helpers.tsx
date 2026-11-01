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

// A stylised CD: a silvery metal disc whose surface sheens rainbow. Real CD
// iridescence comes from thin-film interference and depends on viewing angle,
// but a flat disc facing the camera has a near-constant angle — so we fake the
// classic look by painting concentric rainbow bands in *object space* (so they
// spin with the disc) and adding a bright rainbow rim where the surface goes
// edge-on. Purely cosmetic, and cheap: a handful of dot products per fragment.
export const DISC_VERTEX = /* glsl */ `
  varying vec3 vLocalPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vRadialWorld;

  void main() {
    vLocalPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    // Radial direction in the disc's flat face (cylinder axis = local Y, so the
    // face lies in local XZ), rotated into world space. The fragment gate uses
    // this against a fixed world light: whichever object-space spoke is aligned
    // with the light gets lit, and as the disc spins (UikitSafeFloat) the aligned
    // spoke changes — which is exactly the "a different set of spokes lights up
    // as it rotates" behaviour. modelMatrix isn't available in the fragment
    // shader, so we bake the world transform here.
    vec3 radial = vec3(position.x, 0.0, position.z);
    if (dot(radial, radial) < 1e-8) radial = vec3(0.0, 0.0, 1.0);
    vRadialWorld = normalize(mat3(modelMatrix) * radial);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

// A stylised real-CD look: a DARK, reflective disc body with two opposite
// bright rainbow "spoke fans" (a full line through the hub). The rainbow is a
// STATIC conic gradient painted in object space (hue = f(angle around hub)); a
// WORLD-FIXED gate decides which object-space spokes are currently lit, so as
// the disc spins a different set of them shows the hue while the rest stays the
// dark reflective base. Purely cosmetic and cheap: a handful of dot/pow per
// fragment, no texture fetches, no loops.
export const DISC_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec3 vLocalPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vRadialWorld;

  // HSV -> RGB (cheap, no sin/cos).
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    // 1) Static conic rainbow painted in object space — a full wheel around the
    //    hub, so hue varies across each fan's width (the spectrum wedge).
    float conic  = atan(vLocalPos.z, vLocalPos.x);   // -PI..PI, object space
    float hue    = fract(conic / 6.2831853 + uTime * 0.012);
    vec3 rainbow = hsv2rgb(vec3(hue, 0.85, 1.0));

    // 2) Gate: a fixed world light “lights” the object-space spoke currently
    //    aligned with it. vRadialWorld is already world-space, so the gate is
    //    fixed in the world while the disc spins -> the lit spokes move. The
    //    world light is PROJECTED into the disc's own plane (N is the face
    //    normal, uniform across a flat disc) so this works for any tilt/orient
    //    of the disc. abs() yields two opposite fans (0° and 180°).
    vec3 N   = normalize(vWorldNormal);
    vec3 Lw  = vec3(0.0, 1.0, 0.0);                    // fixed world “light” (top)
    vec3 Lp  = normalize(Lw - dot(Lw, N) * N);         // -> into the disc plane
    float align = dot(normalize(vRadialWorld), Lp);
    float gate  = pow(clamp(abs(align), 0.0, 1.0), 2.5);

    // Fine radial striations inside the fan (the data-track reflection): lines
    // run RADIALY (constant angle), not concentric rings — keep them subtle so
    // they read as texture, not a rainbow bullseye.
    float streak = 0.82 + 0.18 * sin(conic * 220.0);

    // 3) Dark reflective base: soft ambient by view angle + a tight specular
    //    glint + a faint grazing rim — “dark & reflective”, not silver/pastel.
    vec3 V   = normalize(cameraPosition - vWorldPos);
    float NdV = clamp(dot(N, V), 0.0, 1.0);
    vec3 dark = mix(vec3(0.07), vec3(0.19), NdV);
    vec3 Ls   = normalize(vec3(-0.35, 0.5, 0.85));
    float spec = pow(clamp(dot(N, normalize(Ls + V)), 0.0, 1.0), 160.0);
    float rim  = pow(1.0 - NdV, 3.0);
    vec3 base = dark + spec * 0.6 + rim * 0.12;

    // 4) Where the spoke passes show the brightened rainbow; elsewhere the
    //    reflective dark base.
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
