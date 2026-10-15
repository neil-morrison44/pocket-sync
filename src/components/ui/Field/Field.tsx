import React, { ReactNode } from "react"

import clsx from "clsx"

import Icon from "../Icon"

import "./Field.css"

export interface FieldProps {
  /** What to enter, e.g. "Archive name". */
  label: ReactNode
  /** Connects the label to its control's `id`. */
  htmlFor?: string
  /** What the value is for and how to find it, e.g. with an example. */
  hint?: ReactNode
  /** Shown below the control when the value can't be used. */
  error?: ReactNode
  /** The control: an input, select, folder picker, … */
  children: ReactNode
  className?: string
}

/** A form field: label, control, then a hint or an error below it. */
const Field = ({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: FieldProps) => (
  <div className={clsx("field", error && "field--has-error", className)}>
    <label className="field__label" htmlFor={htmlFor}>
      {label}
    </label>
    {children}
    {error ? (
      <div className="field__error" role="alert">
        <Icon icon="warning-diamond" />
        <span>{error}</span>
      </div>
    ) : (
      hint && <div className="field__hint">{hint}</div>
    )}
  </div>
)

export default React.memo(Field)
