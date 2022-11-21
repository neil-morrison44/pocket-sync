import "./index.css"

type Control = {
  text: string
  type: "button" | "back-button" | "checkbox" | "select" | "search"
} & (
  | {
      type: "button"
      onClick: () => void
    }
  | {
      type: "back-button"
      onClick: () => void
    }
  | {
      type: "checkbox"
      checked: boolean
      onChange: (checked: boolean) => void
    }
  | {
      type: "select"
      options: string[]
      selected: string
      onChange: (value: string) => void
    }
  | {
      type: "search"
      value: string
      onChange: (value: string) => void
    }
)

type ControlProps = {
  controls: (Control | null | undefined | "")[]
}

export const Controls = ({ controls }: ControlProps) => {
  return (
    <div className="controls">
      {controls.map((control) => {
        if (!control) return null
        switch (control.type) {
          case "search":
            return (
              <div className="controls__item controls__item--search">
                <input
                  key={control.text}
                  className="controls__search-input"
                  placeholder={control.text}
                  type="search"
                  onChange={({ target }) => control.onChange(target.value)}
                  autoComplete="off"
                  value={control.value}
                  spellCheck={false}
                />
              </div>
            )
          case "select":
            return (
              <div
                className="controls__item controls__item--select"
                key={control.text}
              >
                {control.text}
                <select
                  value={control.selected}
                  onChange={({ target }) => control.onChange(target.value)}
                >
                  {control.options.map((v) => (
                    <option value={v} key={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            )
          case "button":
            return (
              <div
                role="button"
                className="controls__item"
                onClick={control.onClick}
                key={control.text}
              >
                {control.text}
              </div>
            )
          case "back-button":
            return (
              <div
                role="button"
                className="controls__item controls__item--back"
                onClick={control.onClick}
                key={control.text}
              >
                {"Back to List"}
              </div>
            )
          case "checkbox":
            return (
              <label className="controls__item controls__item-checkbox">
                {control.text}
                <input
                  type="checkbox"
                  checked={control.checked}
                  onChange={({ target }) => control.onChange(target.checked)}
                  key={control.text}
                />
              </label>
            )
        }
      })}
    </div>
  )
}
