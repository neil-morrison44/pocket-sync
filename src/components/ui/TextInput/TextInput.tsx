import React, { InputHTMLAttributes } from "react"

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
}

const TextInput = ({
  value,
  onChange,
  icon,
  label,
  placeholder,
  className,
  type = "text",
  variant = "default",
  ...otherProps
}: TextInputProps) => (
  <span
    className={clsx("text-input", `text-input--variant-${variant}`, className)}
  >
    {icon && <Icon icon={icon} />}
    <input
      {...otherProps}
      className="text-input__field"
      type={type}
      value={value}
      placeholder={placeholder}
      aria-label={label ?? otherProps["aria-label"] ?? placeholder}
      onChange={({ target }) => onChange(target.value)}
    />
  </span>
)

export default React.memo(TextInput)
