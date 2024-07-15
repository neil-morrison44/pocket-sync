import { OrbitControls } from "@react-three/drei"
import React, {
  ReactElement,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRecoilValue } from "recoil"
import { Texture } from "three"
import {
  ListPresetInputsSelectorFamily,
  PresetInputSelectorFamily,
} from "../../../../recoil/input/selectors"
import { PlatformImageSelectorFamily } from "../../../../recoil/platforms/selectors"
import { InputKey } from "../../../../types"
import { Modal } from "../../../modal"
import { LabeledLine } from "../../../three/labeledLine"
import { useTranslation } from "react-i18next"
import { ColourContextProviderFromConfig } from "../../../three/colourContext"
import * as THREE from "three"

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
  const platformImage = useRecoilValue(PlatformImageSelectorFamily(platformId))
  const { t } = useTranslation("core_info")
  const presetInputList = useRecoilValue(
    ListPresetInputsSelectorFamily(coreName)
  )

  const [chosenInput, setChosenInput] = useState("core")
  const [screenTexture, setScreenTexture] = useState<Texture | undefined>()

  useEffect(() => {
    const image = new Image()
    image.src = platformImage
    image.onload = () => {
      const canvas = document.createElement("canvas")
      const scale = 5
      canvas.width = 160 * scale
      canvas.height = 144 * scale
      const context = canvas.getContext("2d")
      if (!context) return
      context.fillStyle = "#222"
      context.fillRect(0, 0, canvas.width, canvas.height)
      const imageScale = canvas.width / image.width
      context.drawImage(
        image,
        0,
        canvas.height / 2 - (image.height * imageScale) / 2,
        image.width * imageScale,
        image.height * imageScale
      )

      context.fillStyle = "white"
      context.textAlign = "center"
      let fontSize = 32
      do {
        fontSize -= 1
        context.font = `${fontSize * scale}px GamePocket`
      } while (context.measureText(coreName).width > canvas.width * 0.9)

      context.fillText(coreName, canvas.width / 2, canvas.height - 16 * scale)

      const newTexture = new Texture(canvas)
      newTexture.needsUpdate = true
      newTexture.anisotropy = 16
      setScreenTexture(newTexture)
    }
  }, [coreName, platformImage])

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
        <Suspense>
          <Pocket
            screenMaterial={
              <meshPhysicalMaterial
                attach="material"
                map={screenTexture || undefined}
                emissive={"white"}
                emissiveMap={screenTexture || undefined}
                clearcoat={1}
                envMapIntensity={0.01}
              />
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
  const presetInput = useRecoilValue(
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
