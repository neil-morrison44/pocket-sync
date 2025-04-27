import { ReactNode, startTransition } from "react"

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
      onChange={({ target }) => startTransition(() => onChange(target.checked))}
    />
    {checked ? <CheckCircleIcon /> : <EmptyCircleIcon />}
  </label>
)

const EmptyCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24"
    viewBox="0 -960 960 960"
    width="24"
  >
    <path
      fill="currentColor"
      d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
    />
  </svg>
)

const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24"
    viewBox="0 -960 960 960"
    width="24"
  >
    <path
      fill="currentColor"
      d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"
    />
  </svg>
)
