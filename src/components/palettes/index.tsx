import { useRecoilValue } from "recoil"
import {
  PaletteCodeSelectorFamily,
  PaletteColoursSelectorFamily,
  palettesListSelector,
} from "../../recoil/palettes/selectors"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import "./index.css"
import { Controls } from "../controls"
import { ControlsButton } from "../controls/inputs/button"
import { PaletteFull } from "./paletteFull"
import { ControlsBackButton } from "../controls/inputs/backButton"
import { writeText } from "@tauri-apps/api/clipboard"
import { Modal } from "../modal"
import {
  invokeCopyFiles,
  invokeDeleteFiles,
  invokeSaveFile,
} from "../../utils/invokes"
import { pocketPathAtom } from "../../recoil/atoms"
import { PaletteName } from "./name"
import { useSavePalette } from "./hooks/useSavePalette"
import { Palette, rgb } from "../../types"
import { splitAsPath } from "../../utils/splitAsPath"

export const Palettes = () => {
  const palettesList = useRecoilValue(palettesListSelector)
  const [mode, setMode] = useState<
    { name: "list" } | { name: "new" } | { name: "selected"; palette: string }
  >({ name: "list" })
  const [codeModalOpen, setCodeModalOpen] = useState(false)

  const sortedPalettesList = useMemo(
    () => [...palettesList].sort((a, b) => a.localeCompare(b)),
    [palettesList]
  )

  const savePalette = useSavePalette()

  const createNewPalette = useCallback(async () => {
    const boringPalette = [
      [255, 255, 255],
      [128, 128, 128],
      [32, 32, 32],
      [0, 0, 0],
    ] as [rgb, rgb, rgb, rgb]
    const palette: Palette = {
      background: boringPalette,
      window: boringPalette,
      obj0: boringPalette,
      obj1: boringPalette,
      off: [0, 0, 0],
    }

    await savePalette(palette, "/a_new_palette.pal")
  }, [savePalette])

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
            <ControlsButton onClick={() => createNewPalette()}>
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
          key={mode.palette}
          name={mode.palette}
          onClose={() => setMode({ name: "list" })}
        />
      )}
      {mode.name === "list" && (
        <ul className="palettes__list">
          {sortedPalettesList.map((palette) => (
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
  const pocketPath = useRecoilValue(pocketPathAtom)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [interimName, setInterimName] = useState(() => name.replace(".pal", ""))

  const [renameMode, setRenameMode] = useState(false)

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
  }, [
    paletteColours.background,
    paletteColours.obj0,
    paletteColours.obj1,
    paletteColours.off,
    paletteColours.window,
  ])

  const deletePalette = useCallback(async () => {
    await invokeDeleteFiles([`Assets/gb/common/palettes${name}`])
  }, [name])

  const duplicatePalette = useCallback(async () => {
    await invokeCopyFiles([
      {
        origin: `${pocketPath}/Assets/gb/common/palettes${name}`,
        destination: `${pocketPath}/Assets/gb/common/palettes${name.replace(
          ".pal",
          "_copy.pal"
        )}`,
        exists: true,
      },
    ])
  }, [name, pocketPath])

  const renamePalette = useCallback(async () => {
    setRenameMode(false)

    const origin = `${pocketPath}/Assets/gb/common/palettes/${name}`
    const destination = `${pocketPath}/Assets/gb/common/palettes/${interimName}.pal`
    if (splitAsPath(origin).join("/") === splitAsPath(destination).join("/"))
      return

    await invokeCopyFiles([
      {
        origin,
        destination,
        exists: true,
      },
    ])
    await invokeDeleteFiles([`Assets/gb/common/palettes/${name}`])
  }, [interimName, name, pocketPath])

  return (
    <li className="palettes__list-item">
      <div
        className="palettes__list-item-info"
        onClick={renameMode ? undefined : onClick}
      >
        {renameMode ? (
          <div>
            <input
              type="text"
              className="palettes__list-item-input"
              value={interimName}
              onChange={({ target }) => setInterimName(target.value)}
              onKeyDown={({ key }) => {
                if (key === "Enter") renamePalette()
              }}
            />
            <button onClick={renamePalette}>OK</button>
          </div>
        ) : (
          <PaletteName name={name} />
        )}

        <canvas
          className="palettes__list-item-canvas"
          ref={canvasRef}
          width={4}
          height={5}
        ></canvas>
      </div>
      {/* <div>{paletteCode}</div> */}
      <div className="palettes__list-item-buttons">
        <button onClick={duplicatePalette}>Duplicate</button>
        <button
          onClick={() => {
            writeText(paletteCode)
          }}
        >
          Copy Share Code
        </button>
      </div>

      <div className="palettes__list-item-buttons">
        <button
          onClick={() => {
            setInterimName(name.replace(".pal", ""))
            setRenameMode(true)
          }}
        >
          Rename
        </button>
        <button onClick={deletePalette}>Delete</button>
      </div>
    </li>
  )
}

const AddViaCodeModal = ({ onClose }: { onClose: () => void }) => {
  const [inputedCode, setInputedCode] = useState("")
  const pocketPath = useRecoilValue(pocketPathAtom)

  const parsedPalette = useMemo<{
    name: string
    data: Uint8Array
  } | null>(() => {
    if (inputedCode.length < 56 * 2) return null
    const data = new Uint8Array(56)
    for (let index = 0; index < 56 * 2; index += 2) {
      data[index / 2] = parseInt(
        `${inputedCode[index]}${inputedCode[index + 1]}`,
        16
      )
    }

    if (
      data[51] !== 0x81 ||
      data[52] !== 0x41 ||
      data[53] !== 0x50 ||
      data[54] !== 0x47 ||
      data[55] !== 0x42
    )
      return null

    const name = atob(inputedCode.substring(56 * 2))
    return { name, data }
  }, [inputedCode])

  const onAdd = useCallback(async () => {
    if (!parsedPalette) return
    await invokeSaveFile(
      `${pocketPath}/Assets/gb/common/palettes/${parsedPalette.name}.pal`,
      parsedPalette.data
    )
  }, [parsedPalette, pocketPath])

  return (
    <Modal className="palettes_code-modal">
      <h2>Add via share code</h2>
      <textarea
        className="palettes_code-modal-input"
        value={inputedCode}
        onChange={({ target }) => setInputedCode(target.value)}
      ></textarea>
      <div className="palettes_code-modal-buttons">
        <button onClick={onClose}>Cancel</button>
        {parsedPalette !== null && (
          <>
            <div>{parsedPalette.name}</div>
            <button onClick={onAdd}>Add</button>
          </>
        )}
      </div>
    </Modal>
  )
}
