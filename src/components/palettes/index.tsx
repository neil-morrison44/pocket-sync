import { useRecoilValue } from "recoil"
import {
  PaletteCodeSelectorFamily,
  PaletteColoursSelectorFamily,
  palettesListSelector,
} from "../../recoil/palettes/selectors"
import { useCallback, useEffect, useRef, useState } from "react"

import "./index.css"
import { Controls } from "../controls"
import { ControlsButton } from "../controls/inputs/button"
import { PaletteFull } from "./paletteFull"
import { ControlsBackButton } from "../controls/inputs/backButton"
import { writeText } from "@tauri-apps/api/clipboard"
import { Modal } from "../modal"

export const Palettes = () => {
  const palettesList = useRecoilValue(palettesListSelector)

  const [mode, setMode] = useState<
    { name: "list" } | { name: "new" } | { name: "selected"; palette: string }
  >({ name: "list" })

  const [codeModalOpen, setCodeModalOpen] = useState(false)

  return (
    <div className="palettes">
      <Controls>
        {mode.name === "selected" && (
          <ControlsBackButton onClick={() => setMode({ name: "list" })}>
            {"Back to list"}
          </ControlsBackButton>
        )}

        {mode.name === "list" && (
          <>
            <ControlsButton onClick={() => setCodeModalOpen(true)}>
              {"Add via code"}
            </ControlsButton>
            <ControlsButton onClick={() => setMode({ name: "new" })}>
              {"New Palette"}
            </ControlsButton>
          </>
        )}
      </Controls>

      {codeModalOpen && (
        <AddViaCodeModal onClose={() => setCodeModalOpen(false)} />
      )}

      {mode.name === "selected" && (
        <PaletteFull
          name={mode.palette}
          onClose={() => setMode({ name: "list" })}
        />
      )}
      {mode.name === "list" && (
        <ul className="palettes__list">
          {palettesList.map((palette) => (
            <PaletteListItem
              key={palette}
              name={palette}
              onClick={() => setMode({ name: "selected", palette })}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export const PaletteListItem = ({
  name,
  onClick,
}: {
  name: string
  onClick: () => void
}) => {
  const paletteColours = useRecoilValue(PaletteColoursSelectorFamily(name))
  const paletteCode = useRecoilValue(PaletteCodeSelectorFamily(name))
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext("2d")
    if (!context) return

    const imageData = context.getImageData(0, 0, 4, 5)

    paletteColours.background
      .map((v) => [...v, 255])
      .flat()
      .forEach((v, index) => {
        imageData.data[index] = v
      })

    paletteColours.obj0
      .map((v) => [...v, 255])
      .flat()
      .forEach((v, index) => {
        imageData.data[index + 16] = v
      })

    paletteColours.obj1
      .map((v) => [...v, 255])
      .flat()
      .forEach((v, index) => {
        imageData.data[index + 32] = v
      })

    paletteColours.window
      .map((v) => [...v, 255])
      .flat()
      .forEach((v, index) => {
        imageData.data[index + 48] = v
      })

    context.putImageData(imageData, 0, 0)
    context.fillStyle = `rgb(${paletteColours.off.join(",")})`
    context.fillRect(0, 4, 4, 1)
  }, [])

  console.log({ paletteCode })

  return (
    <li className="palettes__list-item">
      <div className="palettes__list-item-info" onClick={onClick}>
        <div>{name}</div>
        <canvas
          className="palettes__list-item-canvas"
          ref={canvasRef}
          width={4}
          height={5}
        ></canvas>
      </div>
      {/* <div>{paletteCode}</div> */}

      <button
        onClick={() => {
          writeText(paletteCode)
        }}
      >
        Copy Share Code
      </button>
    </li>
  )
}

const AddViaCodeModal = ({ onClose }: { onClose: () => void }) => {
  const [inputedCode, setInputedCode] = useState("")

  const onAdd = useCallback(() => {
    const data = new Uint8Array(56)
    for (let index = 0; index < 56 * 2; index += 2) {
      data[index / 2] = parseInt(
        `${inputedCode[index]}${inputedCode[index + 1]}`,
        16
      )
    }
    const name = atob(inputedCode.substring(56 * 2))
    console.log(data, name)
  }, [inputedCode])

  return (
    <Modal className="palettes_code-modal">
      <h2>Add via share code</h2>
      <input
        type="text"
        className="palettes_code-modal-input"
        value={inputedCode}
        onChange={({ target }) => setInputedCode(target.value)}
      ></input>
      <div className="palettes_code-modal-buttons">
        <button onClick={onClose}>Cancel</button>
        <button onClick={onAdd}>Add</button>
      </div>
    </Modal>
  )
}
