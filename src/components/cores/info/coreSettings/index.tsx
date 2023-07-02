import { Loader } from "@react-three/drei"
import { Suspense, useCallback, useState } from "react"
import { useRecoilState, useRecoilValue } from "recoil"
import { PersistInteractFileAtomFamily } from "../../../../recoil/coreSettings/atoms"
import {
  EMPTY_PERSIST,
  ListPresetInteractSelectorFamily,
  PresetInteractFileSelectorFamily,
} from "../../../../recoil/coreSettings/selectors"
import { InteractPersistJSON } from "../../../../types/interact"
import {
  hex16bitSignedToNumber,
  numberTo16bitSignedHex,
} from "../../../../utils/hexStrings"
import { Modal } from "../../../modal"
import { Tip } from "../../../tip"
import { useTranslation } from "react-i18next"

import "./index.css"

export const CoreSettings = ({
  coreName,
  onClose,
}: {
  coreName: string
  onClose: () => void
}) => {
  const interactFileList = useRecoilValue(
    ListPresetInteractSelectorFamily(coreName)
  )
  const [chosenInteractFile, setChosenInteractFile] = useState("core")

  return (
    <Modal className="core-settings">
      {interactFileList.length > 0 && (
        <select
          style={{ fontSize: "2rem" }}
          onChange={({ target }) => setChosenInteractFile(target.value)}
          value={chosenInteractFile}
        >
          <option value={"core"}>{"Core"}</option>
          {interactFileList.map((fileName) => (
            <option key={fileName} value={fileName}>
              {fileName}
            </option>
          ))}
        </select>
      )}
      <Suspense fallback={<Loader />}>
        <InteractSettings
          coreName={coreName}
          filePath={chosenInteractFile}
          onClose={onClose}
        />
      </Suspense>
    </Modal>
  )
}

const InteractSettings = ({
  coreName,
  filePath,
  onClose,
}: {
  coreName: string
  filePath: "core" | string
  onClose: () => void
}) => {
  const interactJSON = useRecoilValue(
    PresetInteractFileSelectorFamily({ coreName, filePath })
  )
  const [persistJSON, setPersistJSON] = useRecoilState(
    PersistInteractFileAtomFamily({ coreName, filePath })
  )
  const { t } = useTranslation("core_info")

  const updateValue = useCallback(
    (
      id: number | string,
      type: "radio" | "check" | "slider_u32" | "list" | "number_u32",
      val: string | number
    ) => {
      setPersistJSON((current): InteractPersistJSON => {
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
    [setPersistJSON]
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
    [setPersistJSON]
  )

  return (
    <>
      {interactJSON.interact.variables.length === 0 && (
        <Tip>{t("modal.no_settings_found")}</Tip>
      )}

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
              const selectedIndex = persistedValue?.val ?? v.defaultval ?? 0
              const valueOfSelected =
                v.options[
                  typeof selectedIndex === "number"
                    ? selectedIndex
                    : parseInt(selectedIndex)
                ].value
              return (
                <div className={varClassName} key={v.id}>
                  <label>
                    <span className="core-settings__variable-name">
                      {v.name}
                    </span>
                    <select
                      value={valueOfSelected}
                      onChange={({ target }) => {
                        if (!v.persist) return
                        updateValue(
                          v.id,
                          v.type,
                          parseInt(
                            target.selectedOptions[0].dataset.index || "0"
                          )
                        )
                      }}
                    >
                      {v.options.map(({ name, value }, index) => (
                        <option value={value} key={value} data-index={index}>
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
                      checked={Boolean(persistedValue?.val ?? v.defaultval)}
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
              const rawValue = persistedValue?.val ?? v.defaultval ?? 0

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
              const isChecked = Boolean(persistedValue?.val ?? v.defaultval)
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
              const text = JSON.stringify(v, null, 2)
              return <div key={text}>{text}</div>
          }
        })}
      </div>
      <button onClick={() => setPersistJSON(EMPTY_PERSIST)}>
        {t("modal.reset_all")}
      </button>
      <button className="core-settings__close-button" onClick={onClose}>
        {t("modal.close")}
      </button>
    </>
  )
}
