import { OrbitControls } from "@react-three/drei"
import React, { ReactElement, Suspense, useMemo, useState } from "react"
import {
  ListPresetInputsSelectorFamily,
  PresetInputSelectorFamily,
} from "../../../../jotai/input/selectors"
import { InputKey } from "../../../../types"
import { LabeledLine } from "../../../three/labeledLine"
import { useTranslation } from "react-i18next"
import { ColourContextProviderFromConfig } from "../../../three/colourContext"
import * as THREE from "three"
import { useAtomValue } from "jotai"
import { CoreLogoScreen } from "../../../three/coreLogoScreen"
import { StaticScreen } from "../../../three/staticScreen"
import ButtonCombo, { PocketButton } from "../../../ui/ButtonCombo"
import Select from "../../../ui/Select"
import Skeleton from "../../../ui/Skeleton"

import "./index.css"

const Pocket = React.lazy(() =>
  import("../../../three/pocket").then((m) => ({ default: m.Pocket }))
)

const KEY_LINES: {
  [k in InputKey]: { start: THREE.Vector3Tuple; end: THREE.Vector3Tuple }
} = {
  pad_btn_a: { start: [5.25, -6.35, 1.75], end: [15, -5, 10] },
  pad_btn_b: { start: [3.25, -7.75, 1.75], end: [12, -8, 10] },
  pad_btn_x: { start: [3.75, -4.5, 1.75], end: [12, -2, 10] },
  pad_btn_y: { start: [1.55, -5.5, 1.75], end: [-15, 0, 10] },
  pad_trig_l: { start: [-7.5, 5, -2.5], end: [-15, 8, 0] },
  pad_trig_r: { start: [9, 2, -2.5], end: [15, 5, 0] },
  pad_btn_start: { start: [-0.25, -12, 1.5], end: [8, -11, 10] },
  pad_btn_select: { start: [-4, -11.5, 1.5], end: [-8, -10, 10] },
}

/** The list follows the Pocket: face buttons, then shoulders, then the rest. */
const KEY_ORDER: InputKey[] = [
  "pad_btn_a",
  "pad_btn_b",
  "pad_btn_x",
  "pad_btn_y",
  "pad_trig_l",
  "pad_trig_r",
  "pad_btn_start",
  "pad_btn_select",
]

/** Keys the Pocket's glyphs can show; L and R have none and stay text. */
const KEY_BUTTONS: Partial<Record<InputKey, PocketButton>> = {
  pad_btn_a: "a",
  pad_btn_b: "b",
  pad_btn_x: "x",
  pad_btn_y: "y",
  pad_btn_start: "start",
  pad_btn_select: "select",
}

type InputMapping = { id: string | number; name: string; key: InputKey }

/**
 * The core's button mapping: a readable list next to the 3D Pocket, which
 * labels the same buttons on the device.
 */
export const CoreInputs = ({ coreName }: { coreName: string }) => {
  const { t } = useTranslation("core_info")
  const presetInputList = useAtomValue(ListPresetInputsSelectorFamily(coreName))
  const [chosenInput, setChosenInput] = useState("core")

  return (
    <div className="core-inputs">
      {presetInputList.length > 0 && (
        <Select
          label={t("preset")}
          value={chosenInput}
          onChange={setChosenInput}
          options={[
            { value: "core", label: t("modal.input_core") },
            ...presetInputList.map((fileName) => ({
              value: fileName,
              label: fileName,
            })),
          ]}
        />
      )}

      <div className="core-inputs__layout">
        <Suspense fallback={<MappingSkeleton />}>
          <GetInputFile coreName={coreName} filePath={chosenInput}>
            {(inputMappings) => <MappingList mappings={inputMappings} />}
          </GetInputFile>
        </Suspense>

        <div className="core-inputs__pocket">
          <ColourContextProviderFromConfig>
            <Suspense fallback={null}>
              <Pocket
                screenMaterial={
                  <Suspense fallback={<StaticScreen />}>
                    <CoreLogoScreen coreName={coreName} />
                  </Suspense>
                }
              >
                {/* No zoom: the distance is fixed, and zoom would catch the
                    mouse wheel and stop the page from scrolling */}
                <OrbitControls
                  maxDistance={42}
                  minDistance={42}
                  enablePan={false}
                  enableZoom={false}
                />

                <Suspense fallback={null}>
                  <GetInputFile coreName={coreName} filePath={chosenInput}>
                    {(inputMappings) => (
                      <>
                        {inputMappings.map((mapping) => (
                          <LabeledLine
                            key={mapping.key}
                            {...KEY_LINES[mapping.key]}
                          >
                            {mapping.name}
                          </LabeledLine>
                        ))}
                      </>
                    )}
                  </GetInputFile>
                </Suspense>
              </Pocket>
            </Suspense>
          </ColourContextProviderFromConfig>
        </div>
      </div>
    </div>
  )
}

const MappingList = ({ mappings }: { mappings: InputMapping[] }) => {
  const { t } = useTranslation("core_info")

  const sorted = useMemo(
    () =>
      [...mappings].sort(
        (a, b) => KEY_ORDER.indexOf(a.key) - KEY_ORDER.indexOf(b.key)
      ),
    [mappings]
  )

  if (sorted.length === 0) {
    return <p className="core-inputs__empty">{t("inputs_empty")}</p>
  }

  return (
    <dl className="core-inputs__list">
      {sorted.map(({ key, name }) => {
        const button = KEY_BUTTONS[key]
        return (
          <div className="core-inputs__row" key={key}>
            <dt className="core-inputs__key-cell">
              {button ? (
                <ButtonCombo keys={[button]} size={20} />
              ) : (
                <span className="core-inputs__key">
                  {t(`input_keys.${key}`)}
                </span>
              )}
            </dt>
            <dd className="core-inputs__action">{name}</dd>
          </div>
        )
      })}
    </dl>
  )
}

const MappingSkeleton = () => (
  <div className="core-inputs__list">
    <Skeleton width="80%" />
    <Skeleton width="70%" />
    <Skeleton width="75%" />
  </div>
)

const GetInputFile = ({
  coreName,
  filePath,
  children,
}: {
  coreName: string
  filePath: "core" | string
  children: (inputMappings: InputMapping[]) => ReactElement
}) => {
  const presetInput = useAtomValue(
    PresetInputSelectorFamily({ coreName, filePath })
  )

  const inputMappings = useMemo(() => {
    const defaultController = presetInput.input.controllers?.find(
      ({ type }) => type === "default"
    )
    if (!defaultController) return []
    return defaultController.mappings
  }, [presetInput])

  return children(inputMappings)
}
