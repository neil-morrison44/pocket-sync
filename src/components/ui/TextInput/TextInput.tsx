import React, { InputHTMLAttributes, ReactNode } from "react"

import clsx from "clsx"

import Icon, { IconOptions } from "../Icon"

import "./TextInput.css"

export interface TextInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string
  onChange: (value: string) => void
  icon?: IconOptions
  /** `code` shows a monospace value in a dark frame, e.g. for URLs. */
  variant?: "default" | "code"
  /**
   * Accessible name; defaults to the placeholder. Prefer a visible `<label>`.
   */
  label?: string
  /** Shown at the end of the field, e.g. a keyboard shortcut. */
  suffix?: ReactNode
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      value,
      onChange,
      icon,
      label,
      suffix,
      placeholder,
      className,
      type = "text",
      variant = "default",
      ...otherProps
    },
    ref
  ) => (
    <span
      className={clsx(
        "text-input",
        `text-input--variant-${variant}`,
        className
      )}
      // Pressing anywhere in the frame (icon, key caps, padding) focuses the
      // field; buttons and links inside keep their own clicks
      onMouseDown={(event) => {
        const target = event.target as HTMLElement
        if (target.closest("input, button, a")) return
        event.preventDefault()
        event.currentTarget.querySelector("input")?.focus()
      }}
    >
      {icon && <Icon icon={icon} />}
      <input
        {...otherProps}
        ref={ref}
        className="text-input__field"
        type={type}
        value={value}
        placeholder={placeholder}
        aria-label={label ?? otherProps["aria-label"] ?? placeholder}
        onChange={({ target }) => onChange(target.value)}
      />
      {suffix}
    </span>
  )
)

TextInput.displayName = "TextInput"

export default React.memo(TextInput)
