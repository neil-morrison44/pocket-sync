import React, { ReactNode } from "react"

import clsx from "clsx"

import "./ProgressBar.css"

export interface ProgressBarProps {
  /** 0–100. Leave it out while the total isn't known yet (indeterminate). */
  value?: number
  /** What's happening, e.g. the file being copied; shown above the bar. */
  label?: ReactNode
  /** Accessible name when there's no visible label. */
  ariaLabel?: string
  className?: string
}

/**
 * A flat, rectangular progress bar with the app's radius: a frame and a
 * solid accent fill, the label and percentage above it.
 */
const ProgressBar = ({
  value,
  label,
  ariaLabel,
  className,
}: ProgressBarProps) => {
  const clamped =
    value === undefined ? undefined : Math.min(100, Math.max(0, value))

  return (
    <div className={clsx("progress-bar", className)}>
      {(label || clamped !== undefined) && (
        <div className="progress-bar__info">
          <span className="progress-bar__label">{label}</span>
          {clamped !== undefined && (
            <span className="progress-bar__value">
              {/* eslint-disable-next-line react/jsx-no-literals */}
              {clamped.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div
        className={clsx(
          "progress-bar__track",
          clamped === undefined && "progress-bar__track--is-indeterminate"
        )}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
      >
        <div
          className="progress-bar__fill"
          style={{ width: clamped === undefined ? undefined : `${clamped}%` }}
        />
      </div>
    </div>
  )
}

export default React.memo(ProgressBar)
