import Callout from "../../../ui/Callout"
import { Suspense, useCallback, useState } from "react"
import { PersistInteractFileAtomFamily } from "../../../../jotai/coreSettings/atoms"
import {
  EMPTY_PERSIST,
  ListPresetInteractSelectorFamily,
  PresetInteractFileSelectorFamily,
} from "../../../../jotai/coreSettings/selectors"
import {
  hex16bitSignedToNumber,
  numberTo16bitSignedHex,
} from "../../../../utils/hexStrings"
import Button from "../../../ui/Button"
import Select from "../../../ui/Select"
import Skeleton from "../../../ui/Skeleton"
import Switch from "../../../ui/Switch"
import { useTranslation } from "react-i18next"

import "./index.css"
import { useAtom, useAtomValue } from "jotai"

/** The core's own settings (interact.json), saved to its persist file. */
export const CoreSettings = ({ coreName }: { coreName: string }) => {
  const interactFileList = useAtomValue(
    ListPresetInteractSelectorFamily(coreName)
  )
  const [chosenInteractFile, setChosenInteractFile] = useState("core")
  const { t } = useTranslation("core_info")

  return (
    <div className="core-settings">
      {interactFileList.length > 0 && (
        <Select
          label={t("preset")}
          value={chosenInteractFile}
          onChange={setChosenInteractFile}
          options={[
            { value: "core", label: t("modal.input_core") },
            ...interactFileList.map((fileName) => ({
              value: fileName,
              label: fileName,
            })),
          ]}
        />
      )}
      <Suspense fallback={<Skeleton height={120} />}>
        <InteractSettings coreName={coreName} filePath={chosenInteractFile} />
      </Suspense>
    </div>
  )
}

const InteractSettings = ({
  coreName,
  filePath,
}: {
  coreName: string
  filePath: "core" | string
}) => {
  const interactJSON = useAtomValue(
    PresetInteractFileSelectorFamily({ coreName, filePath })
  )
  const [persistJSON, setPersistJSON] = useAtom(
    PersistInteractFileAtomFamily({ coreName, filePath })
  )
  const { t } = useTranslation("core_info")

  const updateValue = useCallback(
    (
      id: number | string,
      type: "radio" | "check" | "slider_u32" | "list" | "number_u32",
      val: string | number
    ) => {
      const current = persistJSON
      const clonedVariables = [...current.interact_persist.variables]
      const newVariables = [
        ...clonedVariables.filter(({ id: oid }) => id !== oid),
        { id, type, val },
      ]

      setPersistJSON({
        interact_persist: {
          ...current.interact_persist,
          variables: newVariables,
        },
      })
    },
    [persistJSON]
  )

  const updateRadioButton = useCallback(
    (id: string | number) => {
      const variable = interactJSON.interact.variables.find(
        ({ id: oid }) => oid === id
      )
      if (variable?.type !== "radio") throw Error("not a radio button")

      const otherIds = interactJSON.interact.variables
        .filter((v) => {
          if (v.type !== "radio") return false
          if (v.group !== variable.group) return false
          if (v.id === id) return false
          return true
        })
        .map(({ id }) => id)

      const current = persistJSON

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
      setPersistJSON({
        interact_persist: {
          ...current.interact_persist,
          variables: newVariables,
        },
      })
    },
    [interactJSON.interact.variables, setPersistJSON, persistJSON]
  )

  return (
    <>
      {interactJSON.interact.variables.length === 0 && (
        <Callout>{t("modal.no_settings_found")}</Callout>
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
            case "list": {
              const selectedIndex = persistedValue?.val ?? v.defaultval ?? 0
              const index =
                typeof selectedIndex === "number"
                  ? selectedIndex
                  : parseInt(selectedIndex)
              return (
                <div className={varClassName} key={v.id}>
                  <span className="core-settings__variable-name">{v.name}</span>
                  <Select
                    value={`${index}`}
                    disabled={!v.persist}
                    onChange={(value) =>
                      updateValue(v.id, v.type, parseInt(value))
                    }
                    options={v.options.map(({ name }, optionIndex) => ({
                      value: `${optionIndex}`,
                      label: name,
                    }))}
                  />
                </div>
              )
            }
            case "check":
              return (
                <div className={varClassName} key={v.id}>
                  <Switch
                    className="core-settings__switch"
                    label={v.name}
                    disabled={!v.persist}
                    value={Boolean(persistedValue?.val ?? v.defaultval)}
                    onChange={(checked) =>
                      updateValue(v.id, v.type, checked ? 1 : 0)
                    }
                  />
                </div>
              )
            case "slider_u32": {
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
                      disabled={!v.persist}
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

                    <span className="core-settings__value">
                      {persistedValue?.val ?? v.defaultval}
                    </span>
                  </label>
                </div>
              )
            }
            case "radio": {
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
                      disabled={!v.persist}
                      value={v.value}
                      name={`${v.group}`}
                    ></input>
                  </label>
                </div>
              )
            }
            case "action":
            case "number_u32":
              return null

            default: {
              const text = JSON.stringify(v, null, 2)
              return <div key={text}>{text}</div>
            }
          }
        })}
      </div>
      {interactJSON.interact.variables.length > 0 && (
        <div>
          <Button
            theme="tertiary"
            icon="reload"
            onClick={() => setPersistJSON(EMPTY_PERSIST)}
          >
            {t("modal.reset_all")}
          </Button>
        </div>
      )}
    </>
  )
}
