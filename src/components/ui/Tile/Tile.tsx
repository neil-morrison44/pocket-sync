import React, { ReactNode } from "react"

import clsx from "clsx"

import "./Tile.css"

export interface TileProps {
  /**
   * The picture: on top and full width (vertical), or on the left
   * (horizontal). An image, canvas or placeholder; e.g. an icon for items
   * without a picture.
   */
  media?: ReactNode
  title: ReactNode
  /** A line below the title, e.g. the author or manufacturer. */
  subtitle?: ReactNode
  /** Running text below the subtitle, e.g. a plugin's description. */
  description?: ReactNode
  /** Small soft details, e.g. a version, year or date. */
  meta?: ReactNode
  /** A `TagList`, pinned to the bottom so tiles in a row line up. */
  tags?: ReactNode
  /**
   * Icon buttons in a row at the bottom. With actions, the media and text
   * become the tile's open button, so the buttons aren't nested in it.
   */
  actions?: ReactNode
  /** Opens or toggles the item; without it the tile isn't interactive. */
  onClick?: () => void
  /** Marks the tile as selected, e.g. in a multi-selection. */
  selected?: boolean
  /**
   * - `vertical`: media on top, full width (the default; cores, platforms,
   *   palettes)
   * - `horizontal`: a small image on the left, text beside it, actions on
   *   the right (save states)
   */
  orientation?: "vertical" | "horizontal"
  className?: string
}

/**
 * A card for one item in a grid (a core, platform, save state, palette):
 * media on top, then title, subtitle, meta and tags. Without `actions` the
 * whole tile is a `role="button"`, which `Grid` picks up for arrow-key
 * navigation and Enter / Space; put such tiles in a `Grid`.
 */
const Tile = ({
  media,
  title,
  subtitle,
  description,
  meta,
  tags,
  actions,
  onClick,
  selected,
  orientation = "vertical",
  className,
}: TileProps) => {
  const content = (
    <>
      {media && <div className="tile__media">{media}</div>}
      <div className="tile__body">
        <div className="tile__title">{title}</div>
        {subtitle && <div className="tile__subtitle">{subtitle}</div>}
        {description && <div className="tile__description">{description}</div>}
        {meta && <div className="tile__meta">{meta}</div>}
        {tags && <div className="tile__tags">{tags}</div>}
      </div>
    </>
  )

  const classNames = clsx(
    "tile",
    `tile--orientation-${orientation}`,
    onClick && "tile--is-interactive",
    selected && "tile--is-selected",
    className
  )

  if (!actions) {
    return (
      <div
        className={classNames}
        role={onClick ? "button" : undefined}
        aria-pressed={onClick ? selected : undefined}
        onClick={onClick}
      >
        {content}
      </div>
    )
  }

  return (
    <div className={classNames}>
      {onClick ? (
        <button
          type="button"
          className="tile__open"
          aria-pressed={selected}
          onClick={onClick}
        >
          {content}
        </button>
      ) : (
        <div className="tile__open">{content}</div>
      )}
      <div className="tile__actions">{actions}</div>
    </div>
  )
}

export default React.memo(Tile)
