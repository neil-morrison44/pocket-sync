import React, { CSSProperties } from "react"

import clsx from "clsx"

import "./Skeleton.css"

export interface SkeletonProps {
  /** Any CSS width, e.g. `"60%"`. Defaults to the full width. */
  width?: CSSProperties["width"]
  /** Any CSS height. Defaults to one line of text. */
  height?: CSSProperties["height"]
  className?: string
}

/** A shimmering placeholder block shown while content loads. */
const Skeleton = ({ width, height, className }: SkeletonProps) => (
  <div
    className={clsx("skeleton", className)}
    style={{ width, height }}
    aria-hidden
  />
)

export interface CardSkeletonProps {
  /** Total card height, so the grid doesn't jump when the card loads. */
  height?: number
}

/** Placeholder shaped like a core or game card: image area and text lines. */
export const CardSkeleton = ({ height }: CardSkeletonProps) => (
  <div className="skeleton-card" style={{ height }} aria-hidden>
    <Skeleton className="skeleton-card__media" />
    <div className="skeleton-card__body">
      <Skeleton width="60%" />
      <Skeleton width="35%" />
      <Skeleton width="45%" />
    </div>
  </div>
)

export default React.memo(Skeleton)
