import React, { ButtonHTMLAttributes, ReactNode } from "react"

import * as RadixSlot from "@radix-ui/react-slot"
import clsx from "clsx"

import Icon, { IconOptions } from "../Icon"

import "./Button.css"

/**
 * - `primary`: the main call to action (accent green)
 * - `secondary`: regular actions (the default)
 * - `tertiary`: low-emphasis actions (outline only)
 * - `destructive`: actions that remove something (red)
 */
export type ButtonTheme = "primary" | "secondary" | "tertiary" | "destructive"

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  children?: ReactNode
  onClick?: () => void
  theme?: ButtonTheme
  icon?: IconOptions
  /**
   * Renders the child element (e.g. a link) with button styling instead of a
   * `<button>`.
   */
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      onClick,
      theme = "secondary",
      icon,
      asChild = false,
      disabled,
      className,
      ...otherProps
    },
    ref
  ) => {
    const Component = asChild ? RadixSlot.Root : "button"

    return (
      <Component
        {...otherProps}
        ref={ref}
        type={asChild ? undefined : (otherProps.type ?? "button")}
        className={clsx(
          "button",
          `button--theme-${theme}`,
          disabled && "button--is-disabled",
          className
        )}
        disabled={disabled}
        onClick={onClick}
      >
        {icon && <Icon icon={icon} />}
        <RadixSlot.Slottable>{children}</RadixSlot.Slottable>
      </Component>
    )
  }
)

Button.displayName = "Button"

export default React.memo(Button)
