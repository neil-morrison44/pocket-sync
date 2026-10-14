import React, { Fragment } from "react"

import clsx from "clsx"
import { useTranslation } from "react-i18next"

import Icon, { IconOptions, IconSize } from "../Icon"

import "./ButtonCombo.css"

/** The three small buttons below the screen, left to right. */
const MENU_ROW = ["select", "analogue", "start"] as const
const DPAD = ["up", "down", "left", "right"] as const
const FACE = ["a", "b", "x", "y"] as const

export type PocketButton =
  | (typeof MENU_ROW)[number]
  | (typeof DPAD)[number]
  | (typeof FACE)[number]

// Select and Start share the small-button glyph (@key06@); Select is drawn
// as a ring (CSS text stroke) and Start as a dot, like Analogue's guides
const MENU_GLYPHS: Record<(typeof MENU_ROW)[number], IconOptions> = {
  select: "button",
  analogue: "analogue-button",
  start: "button",
}

const DPAD_GLYPHS: Record<(typeof DPAD)[number], IconOptions> = {
  up: "dpad-up",
  down: "dpad-down",
  left: "dpad-left",
  right: "dpad-right",
}

// The Pocket's face buttons: X top, A right, B bottom, Y left. Each glyph
// is a single dot in its place, so it's drawn over the dim full cross
const FACE_GLYPHS: Record<(typeof FACE)[number], IconOptions> = {
  x: "face-button-up",
  a: "face-button-right",
  b: "face-button-down",
  y: "face-button-left",
}

export interface ButtonComboProps {
  /** The buttons to press together, e.g. `["analogue", "start"]`. */
  keys: PocketButton[]
  /** Glyph size; 20 and 40 are pixel-perfect. */
  size?: IconSize
  className?: string
}

/**
 * A Pocket button combination drawn with the GamePocket glyphs, like
 * Analogue's guides: the row of small buttons with the pressed ones lit
 * (so Start and Select need no label), plus the D-pad or face buttons
 * with the pressed one marked, joined by "+".
 */
const ButtonCombo = ({ keys, size = 40, className }: ButtonComboProps) => {
  const { t } = useTranslation("pocket_buttons")

  const menuKeys = keys.filter((key): key is (typeof MENU_ROW)[number] =>
    (MENU_ROW as readonly string[]).includes(key)
  )
  const others = keys.filter(
    (key) => !(MENU_ROW as readonly string[]).includes(key)
  )

  const groups = [
    ...(menuKeys.length > 0
      ? [
          <span className="button-combo__row" key="menu">
            {MENU_ROW.map((button) => (
              <Icon
                key={button}
                icon={MENU_GLYPHS[button]}
                size={size}
                className={clsx(
                  "button-combo__glyph",
                  button === "select" && "button-combo__glyph--ring",
                  menuKeys.includes(button) && "button-combo__glyph--is-pressed"
                )}
              />
            ))}
          </span>,
        ]
      : []),
    ...others.map((button) =>
      button in DPAD_GLYPHS ? (
        <Icon
          key={button}
          icon={DPAD_GLYPHS[button as (typeof DPAD)[number]]}
          size={size}
          className="button-combo__glyph button-combo__glyph--is-pressed"
        />
      ) : (
        <span className="button-combo__stack" key={button}>
          <Icon
            icon="face-buttons"
            size={size}
            className="button-combo__glyph"
          />
          <Icon
            icon={FACE_GLYPHS[button as (typeof FACE)[number]]}
            size={size}
            className="button-combo__glyph button-combo__glyph--is-pressed"
          />
        </span>
      )
    ),
  ]

  return (
    <span
      className={clsx("button-combo", className)}
      role="img"
      aria-label={keys.map((key) => t(key)).join(" + ")}
    >
      {groups.map((group, index) => (
        <Fragment key={index}>
          {index > 0 && <span className="button-combo__plus" />}
          {group}
        </Fragment>
      ))}
    </span>
  )
}

export default React.memo(ButtonCombo)
