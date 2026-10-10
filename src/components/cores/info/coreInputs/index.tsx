import { OrbitControls } from "@react-three/drei"
import React, {
  ReactElement,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react"
import { Texture } from "three"
import {
  ListPresetInputsSelectorFamily,
  PresetInputSelectorFamily,
} from "../../../../jotai/input/selectors"
import { PlatformImageSelectorFamily } from "../../../../jotai/platforms/selectors"
import { InputKey } from "../../../../types"
import { Modal } from "../../../modal"
import { LabeledLine } from "../../../three/labeledLine"
import { useTranslation } from "react-i18next"
import { ColourContextProviderFromConfig } from "../../../three/colourContext"
import * as THREE from "three"
import { useAtomValue } from "jotai"
import { CoreLogoScreen } from "../../../three/coreLogoScreen"
import { StaticScreen } from "../../../three/staticScreen"

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

export const CoreInputs = ({
  coreName,
  onClose,
  platformId = "",
}: {
  coreName: string
  onClose: () => void
  platformId: string
}) => {
  const { t } = useTranslation("core_info")
  const presetInputList = useAtomValue(ListPresetInputsSelectorFamily(coreName))
  const [chosenInput, setChosenInput] = useState("core")

  return (
    <Modal>
      {presetInputList.length > 0 && (
        <select
          style={{ fontSize: "2rem" }}
          onChange={({ target }) => setChosenInput(target.value)}
          value={chosenInput}
        >
          <option value={"core"}>{t("modal.input_core")}</option>
          {presetInputList.map((fileName) => (
            <option key={fileName} value={fileName}>
              {fileName}
            </option>
          ))}
        </select>
      )}
      <ColourContextProviderFromConfig>
        <Suspense fallback={<div>{"Suspending?"}</div>}>
          <Pocket
            screenMaterial={
              <Suspense fallback={<StaticScreen />}>
                <CoreLogoScreen coreName={coreName} />
              </Suspense>
            }
          >
            <OrbitControls
              maxDistance={42}
              minDistance={42}
              enablePan={false}
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

      <button onClick={onClose}>{t("modal.close")}</button>
    </Modal>
  )
}

const GetInputFile = ({
  coreName,
  filePath,
  children,
}: {
  coreName: string
  filePath: "core" | string
  children: (
    inputMappings: {
      id: string | number
      name: string
      key: InputKey
    }[]
  ) => ReactElement
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
