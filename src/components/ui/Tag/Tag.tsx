import React, { HTMLAttributes, ReactNode } from "react"

import clsx from "clsx"

import Icon, { IconOptions } from "../Icon"

import "./Tag.css"

/**
 * - `neutral`: plain facts, e.g. "Installed" or a supported feature (the
 *   default)
 * - `accent`: something to act on, e.g. an available update (accent green)
 * - `warning`: worth a look, e.g. the AI-ness score
 * - `danger`: a problem, e.g. a replaced core
 * - `highlight`: special requirements, e.g. a license
 * - `analogizer`: Analogizer support, in its brand blue
 */
export type TagTheme =
  | "neutral"
  | "accent"
  | "warning"
  | "danger"
  | "highlight"
  | "analogizer"

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  theme?: TagTheme
  icon?: IconOptions
}

/**
 * A small slanted chip that labels an item, e.g. "Analogizer" on a core.
 * Its icon scales with the tag's text.
 */
const Tag = ({
  children,
  theme = "neutral",
  icon,
  className,
  ...otherProps
}: TagProps) => (
  <span
    {...otherProps}
    className={clsx("tag", `tag--theme-${theme}`, className)}
  >
    {icon && <Icon icon={icon} size="text" />}
    {children}
  </span>
)

/** A wrapping row of tags. */
export const TagList = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => <div className={clsx("tag-list", className)}>{children}</div>

export default React.memo(Tag)
