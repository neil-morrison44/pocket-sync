import React, { ReactNode } from "react"

import * as RadixToggle from "@radix-ui/react-toggle"
import clsx from "clsx"

import Icon from "../Icon"

import "./Toggle.css"

export type ToggleTheme = "control"

export interface ToggleProps {
  children: ReactNode
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  theme?: ToggleTheme
  className?: string
}

const Toggle = ({
  children,
  value,
  onChange,
  disabled = false,
  theme = "control",
  className,
}: ToggleProps) => (
  <RadixToggle.Root
    className={clsx(
      "toggle",
      `toggle--theme-${theme}`,
      value && "toggle--is-pressed",
      disabled && "toggle--is-disabled",
      className
    )}
    pressed={value}
    onPressedChange={onChange}
    disabled={disabled}
  >
    {children}
    <Icon icon={value ? "checkbox-on" : "circle"} />
  </RadixToggle.Root>
)

export default React.memo(Toggle)
