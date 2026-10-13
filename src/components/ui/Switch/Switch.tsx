import React, { ReactNode, useId } from "react"

import * as RadixSwitch from "@radix-ui/react-switch"
import clsx from "clsx"

import "./Switch.css"

export interface SwitchProps {
  value: boolean
  onChange: (value: boolean) => void
  label?: ReactNode
  disabled?: boolean
  className?: string
}

// For settings that apply immediately. Use a checkbox (or Toggle) when the
// choice only takes effect after a separate save or submit.
const Switch = ({
  value,
  onChange,
  label,
  disabled = false,
  className,
}: SwitchProps) => {
  const id = useId()

  return (
    <div
      className={clsx(
        "switch",
        value && "switch--is-checked",
        disabled && "switch--is-disabled",
        className
      )}
    >
      {label && (
        <label className="switch__label" htmlFor={id}>
          {label}
        </label>
      )}
      <RadixSwitch.Root
        id={id}
        className="switch__track"
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
      >
        <RadixSwitch.Thumb className="switch__thumb" />
      </RadixSwitch.Root>
    </div>
  )
}

export default React.memo(Switch)
