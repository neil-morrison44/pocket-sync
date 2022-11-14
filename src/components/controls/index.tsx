import "./index.css"

type Control = {
  text: string
  type: "button" | "back-button" | "checkbox"
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
)

type ControlProps = {
  controls: Control[]
}

export const Controls = ({ controls }: ControlProps) => {
  return (
    <div className="controls">
      {controls.map((control) => {
        switch (control.type) {
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
