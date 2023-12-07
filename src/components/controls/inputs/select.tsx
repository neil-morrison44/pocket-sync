import { ReactNode } from "react"

type ControlsSelectProps = {
  options: string[]
  selected: string
  children: ReactNode
  onChange: (value: string) => void
}

export const ControlsSelect = ({
  children,
  options,
  selected,
  onChange,
}: ControlsSelectProps) => (
  // <div role="button" className="controls__button" onClick={onClick}>
  //   {children}
  // </div>

  <label
    className="controls__item controls__select
  controls__item--select"
  >
    {children}
    <select value={selected} onChange={({ target }) => onChange(target.value)}>
      {options.map((v) => (
        <option value={v} key={v}>
          {v}
        </option>
      ))}
    </select>
  </label>
)
