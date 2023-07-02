import { useId, useState } from "react"
import { useTranslation } from "react-i18next"

type EditableProps = {
  type: "freetext" | "freetext-with-choices" | "number"
  initialValue: string | number
  options?: string[]
} & (
  | {
      type: "freetext"
      initialValue: string
      options?: never
      onSave: (v: string) => void
    }
  | {
      type: "freetext-with-choices"
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

export const Editable = ({
  type,
  initialValue,
  options,
  onSave,
}: EditableProps) => {
  const [editMode, setEditMode] = useState(false)
  const [localValue, setLocalValue] =
    useState<typeof initialValue>(initialValue)
  const uuid = useId()
  const { t } = useTranslation("platforms")

  if (!editMode)
    return (
      <div className="platforms__editable platforms__editable--pre-edit">
        {initialValue}
        <div
          className="platforms__edit-button"
          onClick={() => setEditMode(true)}
        >
          {t("edit")}
        </div>
      </div>
    )

  if (type === "freetext-with-choices" || type === "freetext") {
    return (
      <div className="platforms__editable">
        <>
          <input
            type="text"
            list={uuid}
            value={localValue}
            onChange={({ target }) => setLocalValue(target.value)}
          />
          {type === "freetext-with-choices" && (
            <datalist id={uuid}>
              {options.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </datalist>
          )}
        </>
        <button
          onClick={() => {
            onSave(localValue as string)
            setEditMode(false)
          }}
        >
          {t("save")}
        </button>
        <button onClick={() => setEditMode(false)}>{t("cancel")}</button>
      </div>
    )
  }

  if (type === "number") {
    return (
      <div className="platforms__editable">
        <input
          type="number"
          list={uuid}
          value={localValue}
          onChange={({ target }) => setLocalValue(parseInt(target.value))}
        />
        <button
          onClick={() => {
            onSave(localValue as number)
            setEditMode(false)
          }}
        >
          {t("save")}
        </button>
        <button onClick={() => setEditMode(false)}>{t("cancel")}</button>
      </div>
    )
  }

  return null
}
