import React, { useEffect, useState } from "react"

import clsx from "clsx"
import { useTranslation } from "react-i18next"

import Icon, { IconOptions, IconSize } from "../Icon"

import "./Spinner.css"

/**
 * - `dpad`: the D-pad presses up, right, down, left (the default)
 * - `keypad`: the face buttons, in the same circle
 */
export type SpinnerVariant = "dpad" | "keypad"

// The first glyph of each set (the plain pad / all buttons) is left out
const FRAMES: Record<SpinnerVariant, IconOptions[]> = {
  dpad: ["dpad-up", "dpad-right", "dpad-down", "dpad-left"],
  keypad: [
    "face-button-up",
    "face-button-right",
    "face-button-down",
    "face-button-left",
  ],
}

/** How long each frame shows. */
export const SPINNER_FRAME_MS = 160

export interface SpinnerProps {
  variant?: SpinnerVariant
  /** Glyph size; 20 and 40 are pixel-perfect. */
  size?: IconSize
  /** Milliseconds per frame; only for tuning (Settings → Developer). */
  frameMs?: number
  className?: string
}

/** Loading indicator: the Pocket's D-pad or buttons, pressed in a circle. */
const Spinner = ({
  variant = "dpad",
  size = 40,
  frameMs = SPINNER_FRAME_MS,
  className,
}: SpinnerProps) => {
  const [frame, setFrame] = useState(0)
  const { t } = useTranslation("app")
  const frames = FRAMES[variant]

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const interval = setInterval(
      () => setFrame((current) => (current + 1) % frames.length),
      frameMs
    )
    return () => clearInterval(interval)
  }, [frames.length, frameMs])

  return (
    <span
      className={clsx("spinner", className)}
      role="status"
      aria-label={t("loading")}
    >
      {/* Face-button glyphs are single dots, so they're drawn over the dim
          full cross; the D-pad glyphs are complete pads */}
      {variant === "keypad" && (
        <Icon icon="face-buttons" size={size} className="spinner__base" />
      )}
      <Icon icon={frames[frame]} size={size} className="spinner__frame" />
    </span>
  )
}

export default React.memo(Spinner)
