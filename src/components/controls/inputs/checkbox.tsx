import { ReactNode, startTransition } from "react"
import Toggle from "../../ui/Toggle"

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
  <Toggle
    value={checked}
    onChange={(value) => startTransition(() => onChange(value))}
  >
    {children}
  </Toggle>
)
