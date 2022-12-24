import { OrbitControls } from "@react-three/drei"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useRecoilValue } from "recoil"
import { MeshPhongMaterial, Texture } from "three"
import { PlatformImageSelectorFamily } from "../../../../recoil/platforms/selectors"
import { CoreInputSelectorFamily } from "../../../../recoil/selectors"
import { InputKey } from "../../../../types"
import { Modal } from "../../../modal"
import { LabeledLine } from "../../../three/labeledLine"
import { Pocket } from "../../../three/pocket"
import { RandomScreenshotScreen } from "../../../three/randomScreenshotScreen"

const KEY_LINES: {
  [k in InputKey]: { start: THREE.Vector3Tuple; end: THREE.Vector3Tuple }
} = {
  pad_btn_a: { start: [5, -4, 1.75], end: [15, -5, 10] },
  pad_btn_b: { start: [3, -5.5, 1.75], end: [12, -8, 10] },
  pad_btn_x: { start: [3.5, -2.1, 1.75], end: [12, -2, 10] },
  pad_btn_y: { start: [1.55, -3.25, 1.75], end: [-15, 0, 10] },
  pad_trig_l: { start: [-7.5, 5, -1.5], end: [-15, 8, 0] },
  pad_trig_r: { start: [9, 2, -1.5], end: [15, 5, 0] },
  pad_btn_start: { start: [-0.25, -10.25, 1.5], end: [8, -11, 10] },
  pad_btn_select: { start: [-3.8, -9.5, 1.5], end: [-8, -10, 10] },
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
  const coreInput = useRecoilValue(CoreInputSelectorFamily(coreName))
  const platformImage = useRecoilValue(PlatformImageSelectorFamily(platformId))

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
        context.font = `${fontSize * scale}px Analogue`
      } while (context.measureText(coreName).width > canvas.width * 0.9)

      context.fillText(coreName, canvas.width / 2, canvas.height - 16 * scale)

      const newTexture = new Texture(canvas)
      newTexture.needsUpdate = true
      newTexture.anisotropy = 16
      setScreenTexture(newTexture)
    }
  }, [platformImage])

  const inputMappings = useMemo(() => {
    const defaultController = coreInput.input.controllers?.find(
      ({ type }) => type === "default"
    )
    if (!defaultController) return []
    return defaultController.mappings
  }, [coreInput])

  return (
    <Modal>
      <Pocket
        screenMaterial={
          <meshBasicMaterial
            attach="material"
            map={screenTexture || undefined}
          ></meshBasicMaterial>
        }
      >
        <OrbitControls maxDistance={42} minDistance={42} enablePan={false} />

        {inputMappings.map((mapping) => (
          <LabeledLine key={mapping.key} {...KEY_LINES[mapping.key]}>
            {mapping.name}
          </LabeledLine>
        ))}
      </Pocket>

      <button onClick={onClose}>Close</button>
    </Modal>
  )
}
