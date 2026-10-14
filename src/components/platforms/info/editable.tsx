import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import Button from "../../ui/Button"
import TextInput from "../../ui/TextInput"

type EditableProps = {
  /** Names the field, e.g. "Manufacturer". */
  label: string
} & (
  | {
      type: "freetext"
      initialValue: string
      options?: never
      onSave: (v: string) => void
    }
  | {
      type: "freetext-with-choices"
      /** Suggestions while typing; any other value is allowed too. */
      options: string[]
      initialValue: string
      onSave: (v: string) => void
    }
  | {
      type: "number"
      options?: never
      initialValue: number
      onSave: (v: number) => void
    }
)

/** One platform field: its value with an Edit button, or a field to change it. */
export const Editable = (props: EditableProps) => {
  const { type, label, initialValue, options } = props
  const [editMode, setEditMode] = useState(false)
  const [localValue, setLocalValue] = useState(`${initialValue}`)
  const listId = useId()
  const { t } = useTranslation("platforms")

  const save = () => {
    if (props.type === "number") props.onSave(parseInt(localValue))
    else props.onSave(localValue)
    setEditMode(false)
  }

  return (
    <div className="platforms__editable">
      <span className="platforms__editable-label">{label}</span>
      {editMode ? (
        <form
          className="platforms__editable-form"
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
        >
          <TextInput
            className="platforms__editable-input"
            label={label}
            type={type === "number" ? "number" : "text"}
            list={type === "freetext-with-choices" ? listId : undefined}
            value={localValue}
            onChange={setLocalValue}
            autoFocus
          />
          {type === "freetext-with-choices" && (
            <datalist id={listId}>
              {options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </datalist>
          )}
          <Button theme="primary" type="submit">
            {t("save")}
          </Button>
          <Button
            theme="tertiary"
            onClick={() => {
              setLocalValue(`${initialValue}`)
              setEditMode(false)
            }}
          >
            {t("cancel")}
          </Button>
        </form>
      ) : (
        <>
          <span className="platforms__editable-value">{initialValue}</span>
          <Button
            theme="tertiary"
            icon="pencil"
            className="platforms__edit-button"
            onClick={() => setEditMode(true)}
          >
            {t("edit")}
          </Button>
        </>
      )}
    </div>
  )
}
