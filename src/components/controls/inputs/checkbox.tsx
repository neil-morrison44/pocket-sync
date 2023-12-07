import { ReactNode } from "react"

type ControlsCheckboxProps = {
  children: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}

export const ControlsCheckbox = ({
  children,
  checked,
  onChange,
}: ControlsCheckboxProps) => (
  <label
    className={`controls__item controls__checkbox ${
      checked ? "controls__checkbox--checked" : ""
    }`}
  >
    {children}
    <input
      type="checkbox"
      checked={checked}
      onChange={({ target }) => onChange(target.checked)}
    />
  </label>
)
