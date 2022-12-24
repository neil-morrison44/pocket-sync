import { useCallback } from "react"
import { useRecoilState, useRecoilValue } from "recoil"
import { CorePersistInteractFileAtomFamily } from "../../../../recoil/coreSettings/atoms"
import {
  CoreInteractFileSelectorFamily,
  EMPTY_PERSIST,
  settingsFolderReadonlySelector,
} from "../../../../recoil/coreSettings/selectors"
import { InteractPersistJSON } from "../../../../types/interact"
import {
  hex16bitSignedToNumber,
  numberTo16bitSignedHex,
} from "../../../../utils/hexStrings"
import { Modal } from "../../../modal"

import "./index.css"

export const CoreSettings = ({
  coreName,
  onClose,
}: {
  coreName: string
  onClose: () => void
}) => {
  const interactJSON = useRecoilValue(CoreInteractFileSelectorFamily(coreName))
  const isReadOnly = useRecoilValue(settingsFolderReadonlySelector)
  const [persistJSON, setPersistJSON] = useRecoilState(
    CorePersistInteractFileAtomFamily(coreName)
  )

  const updateValue = useCallback(
    (
      id: number | string,
      type: "radio" | "check" | "slider_u32" | "list" | "number_u32",
      val: string | number
    ) => {
      setPersistJSON((current): InteractPersistJSON => {
        if (isReadOnly) return current
        const clonedVariables = [...current.interact_persist.variables]
        const newVariables = [
          ...clonedVariables.filter(({ id: oid }) => id !== oid),
          { id, type, val },
        ]

        return {
          interact_persist: {
            ...current.interact_persist,
            variables: newVariables,
          },
        }
      })
    },
    [setPersistJSON, isReadOnly]
  )

  const updateRadioButton = useCallback(
    (id: string | number) => {
      const variable = interactJSON.interact.variables.find(
        ({ id: oid }) => oid === id
      )
      if (variable?.type !== "radio") throw Error("not a radio button")

      if (variable.type === "radio") {
        variable.group
      }

      const otherIds = interactJSON.interact.variables
        .filter((v) => {
          if (v.type !== "radio") return false
          if (v.group !== variable.group) return false
          if (v.id === id) return false
          return true
        })
        .map(({ id }) => id)

      setPersistJSON((current): InteractPersistJSON => {
        if (isReadOnly) return current
        const clonedVariables = [...current.interact_persist.variables]
        const newVariables = [
          ...clonedVariables.filter(
            ({ id: oid }) => !(otherIds.includes(oid) || oid === id)
          ),
          ...clonedVariables
            .filter(({ id: oid }) => otherIds.includes(oid))
            .map((v) => ({ ...v, val: 0 })),

          { id: id, type: "radio", val: 1 } as const,
        ]
        return {
          interact_persist: {
            ...current.interact_persist,
            variables: newVariables,
          },
        }
      })
    },
    [setPersistJSON, isReadOnly]
  )

  return (
    <Modal className="core-settings">
      {isReadOnly && <h3>The `Settings` folder is Read Only</h3>}

      <div className="core-settings__settings">
        {interactJSON.interact.variables.map((v) => {
          const persist = v.persist
          const persistedValue = persistJSON.interact_persist.variables.find(
            ({ id }) => id === v.id
          )

          const varClassName = `core-settings__variable core-settings__variable--${
            persist ? "persist" : "non-persist"
          }`

          switch (v.type) {
            case "list":
              return (
                <div className={varClassName} key={v.id}>
                  <label>
                    <span className="core-settings__variable-name">
                      {v.name}
                    </span>
                    <select
                      value={persistedValue?.val || v.defaultval}
                      onChange={({ target }) => {
                        if (!v.persist) return
                        updateValue(v.id, v.type, target.value)
                      }}
                    >
                      {v.options.map(({ name, value }) => (
                        <option value={value} key={value}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )
            case "check":
              return (
                <div className={varClassName} key={v.id}>
                  <label>
                    <span className="core-settings__variable-name">
                      {v.name}
                    </span>
                    <input
                      checked={Boolean(persistedValue?.val || v.defaultval)}
                      onChange={({ target }) => {
                        if (!v.persist) return
                        updateValue(v.id, v.type, target.checked ? 1 : 0)
                      }}
                      type="checkbox"
                    ></input>
                  </label>
                </div>
              )
            case "slider_u32":
              const rawValue = persistedValue?.val || v.defaultval || 0

              const value =
                typeof rawValue === "string"
                  ? hex16bitSignedToNumber(rawValue)
                  : rawValue

              return (
                <div className={varClassName} key={v.id}>
                  <label>
                    <span className="core-settings__variable-name">
                      {v.name}
                    </span>
                    <input
                      type="range"
                      min={v.graphical.min}
                      max={v.graphical.max}
                      value={value}
                      onChange={({ target }) => {
                        if (!v.persist) return

                        const newValue =
                          typeof rawValue === "string"
                            ? numberTo16bitSignedHex(parseInt(target.value))
                            : parseInt(target.value)

                        updateValue(v.id, v.type, newValue)
                      }}
                    ></input>

                    <span>{`(${persistedValue?.val ?? v.defaultval})`}</span>
                  </label>
                </div>
              )

            case "radio":
              const isChecked = Boolean(persistedValue?.val || v.defaultval)
              // console.log({ isChecked })
              return (
                <div className={varClassName} key={v.id}>
                  <label>
                    <span className="core-settings__variable-name">
                      {v.name}
                    </span>
                    <input
                      checked={isChecked}
                      onChange={() => {
                        if (!v.persist) return
                        updateRadioButton(v.id)
                      }}
                      type="radio"
                      value={v.value}
                      name={`${v.group}`}
                    ></input>
                  </label>
                </div>
              )
            case "action":
            case "number_u32":
              return null

            default:
              return <div key={v.id}>{JSON.stringify(v, null, 2)}</div>
          }
        })}
      </div>
      <button
        style={{
          opacity: isReadOnly ? 0.1 : 1,
          pointerEvents: isReadOnly ? "none" : undefined,
        }}
        onClick={() => setPersistJSON(EMPTY_PERSIST)}
      >
        Reset All
      </button>
      <button className="core-settings__close-button" onClick={onClose}>
        Close
      </button>
    </Modal>
  )
}
