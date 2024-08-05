import { useRecoilValue } from "recoil"
import {
  PaletteCodeSelectorFamily,
  palettesListSelector,
} from "../../recoil/palettes/selectors"
import { Suspense, useCallback, useMemo, useState } from "react"

import "./index.css"
import { Controls } from "../controls"
import { ControlsButton } from "../controls/inputs/button"
import { PaletteFull } from "./paletteFull"
import { ControlsBackButton } from "../controls/inputs/backButton"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"
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
import { useTranslation } from "react-i18next"
import { PreviewCanvas } from "./previewCanvas"
import { PaletteTown } from "./town"

export const Palettes = () => {
  const palettesList = useRecoilValue(palettesListSelector)
  const { t } = useTranslation("palettes")
  const [mode, setMode] = useState<
    { name: "list" } | { name: "new" } | { name: "selected"; palette: string }
  >({ name: "list" })
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [townOpen, setTownOpen] = useState(false)

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
      off: [255, 255, 255],
    }

    await savePalette(palette, "/a_new_palette.pal")
  }, [savePalette])

  return (
    <div className="palettes">
      <Controls>
        {mode.name === "selected" && (
          <ControlsBackButton onClick={() => setMode({ name: "list" })}>
            {t("buttons.back")}
          </ControlsBackButton>
        )}

        {mode.name === "list" && (
          <>
            <ControlsButton onClick={() => setCodeModalOpen(true)}>
              {t("buttons.add_via_code")}
            </ControlsButton>
            <ControlsButton onClick={() => setTownOpen(true)}>
              {t("buttons.palette_town")}
            </ControlsButton>
            <ControlsButton onClick={() => createNewPalette()}>
              {t("buttons.new")}
            </ControlsButton>
          </>
        )}
      </Controls>

      {townOpen && <PaletteTown onClose={() => setTownOpen(false)} />}

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
  const paletteCode = useRecoilValue(PaletteCodeSelectorFamily(name))
  const pocketPath = useRecoilValue(pocketPathAtom)
  const [interimName, setInterimName] = useState(() => name.replace(".pal", ""))
  const { t } = useTranslation("palettes")
  const [renameMode, setRenameMode] = useState(false)

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
            <button onClick={renamePalette}>
              <CheckIcon />
            </button>
          </div>
        ) : (
          <PaletteName name={name} />
        )}

        <Suspense>
          <PreviewCanvas name={name} />
        </Suspense>
      </div>
      <div className="palettes__list-item-buttons">
        <button onClick={duplicatePalette}>{t("item.duplicate")}</button>
        <button
          onClick={() => {
            writeText(paletteCode)
          }}
        >
          {t("item.copy_code")}
        </button>
      </div>

      <div className="palettes__list-item-buttons">
        <button
          onClick={() => {
            setInterimName(name.replace(".pal", ""))
            setRenameMode(true)
          }}
        >
          {t("item.rename")}
        </button>
        <button onClick={deletePalette}>{t("item.delete")}</button>
      </div>
    </li>
  )
}

const AddViaCodeModal = ({ onClose }: { onClose: () => void }) => {
  const [inputedCode, setInputedCode] = useState("")
  const pocketPath = useRecoilValue(pocketPathAtom)
  const { t } = useTranslation("palettes")

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
      `${pocketPath}/Assets/gb/common/palettes/${parsedPalette.name}`,
      parsedPalette.data
    )
    onClose()
  }, [onClose, parsedPalette, pocketPath])

  return (
    <Modal className="palettes_code-modal">
      <h2>{t("add_via_code.title")}</h2>
      <textarea
        className="palettes_code-modal-input"
        value={inputedCode}
        onChange={({ target }) => setInputedCode(target.value)}
      ></textarea>
      <div className="palettes_code-modal-buttons">
        <button onClick={onClose}>{t("add_via_code.cancel")}</button>
        {parsedPalette !== null && (
          <>
            <div>{parsedPalette.name}</div>
            <button onClick={onAdd}>{t("add_via_code.add")}</button>
          </>
        )}
      </div>
    </Modal>
  )
}

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="1.1em"
    viewBox="0 -960 960 960"
    width="1.1em"
  >
    <path
      fill="currentColor"
      d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"
    />
  </svg>
)
