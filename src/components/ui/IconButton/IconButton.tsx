import React from "react"

import clsx from "clsx"

import Button, { ButtonProps } from "../Button"
import { IconOptions } from "../Icon"
import Tooltip from "../Tooltip"

import "./IconButton.css"

export interface IconButtonProps
  extends Omit<ButtonProps, "children" | "icon" | "asChild"> {
  icon: IconOptions
  /**
   * Shown as a tooltip and used as the accessible name, so no button is ever
   * without a label.
   */
  label: string
  tooltipSide?: "top" | "right" | "bottom" | "left"
  /** Keeps the label tooltip open, e.g. to confirm "Copied". */
  tooltipOpen?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon, label, tooltipSide = "top", tooltipOpen, className, ...otherProps },
    ref
  ) => (
    <Tooltip label={label} side={tooltipSide} forceOpen={tooltipOpen}>
      <Button
        {...otherProps}
        ref={ref}
        icon={icon}
        aria-label={label}
        className={clsx("icon-button", className)}
      />
    </Tooltip>
  )
)

IconButton.displayName = "IconButton"

export default React.memo(IconButton)
