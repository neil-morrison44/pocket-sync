import {
  PaletteCodeSelectorFamily,
  palettesListSelector,
} from "../../jotai/palettes/selectors"
import {
  Dispatch,
  SetStateAction,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react"

import "./index.css"
import { Controls, ControlsActions } from "../controls"
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
import { pocketPathAtom } from "../../jotai/atoms"
import { PaletteName } from "./name"
import { useSavePalette } from "./hooks/useSavePalette"
import { Palette, rgb } from "../../types"
import { splitAsPath } from "../../utils/splitAsPath"
import { useTranslation } from "react-i18next"
import { PreviewCanvas } from "./previewCanvas"
import { PaletteTown } from "./town"
import { useAtomValue } from "jotai"
import EmptyState from "../ui/EmptyState"
import IconButton from "../ui/IconButton"
import Tile from "../ui/Tile"
import { Grid } from "../grid"
import { CardSkeleton } from "../ui/Skeleton"
import TextInput from "../ui/TextInput"

type PaletteUIModes =
  | { name: "list" }
  | { name: "new" }
  | { name: "selected"; palette: string }

export const Palettes = () => {
  const { t } = useTranslation("palettes")
  const [mode, setMode] = useState<PaletteUIModes>({ name: "list" })
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [townOpen, setTownOpen] = useState(false)
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

        <ControlsActions>
          {mode.name === "list" && (
            <>
              <ControlsButton onClick={() => setCodeModalOpen(true)}>
                {t("buttons.add_via_code")}
              </ControlsButton>
              <ControlsButton
                onClick={() => {
                  setTownOpen(true)
                }}
              >
                {t("buttons.palette_town")}
              </ControlsButton>
              <ControlsButton onClick={() => createNewPalette()}>
                {t("buttons.new")}
              </ControlsButton>
            </>
          )}
        </ControlsActions>
      </Controls>

      {townOpen && <PaletteTown onClose={() => setTownOpen(false)} />}

      {codeModalOpen && (
        <AddViaCodeModal onClose={() => setCodeModalOpen(false)} />
      )}

      {mode.name === "selected" && (
        <Suspense>
          <PaletteFull
            key={mode.palette}
            name={mode.palette}
            onClose={() => setMode({ name: "list" })}
          />
        </Suspense>
      )}
      {mode.name === "list" && (
        // Skeleton tiles while the list loads, instead of a blank page
        <Suspense fallback={<PaletteListSkeleton />}>
          <PaletteList setMode={setMode} />
        </Suspense>
      )}
    </div>
  )
}

const PaletteListSkeleton = () => (
  <div className="grid" aria-hidden>
    {Array.from({ length: 6 }, (_, index) => (
      <CardSkeleton key={index} height={260} />
    ))}
  </div>
)

type PaletteListProps = {
  setMode: Dispatch<SetStateAction<PaletteUIModes>>
}

const PaletteList = ({ setMode }: PaletteListProps) => {
  const palettesList = useAtomValue(palettesListSelector)
  const { t } = useTranslation("palettes")

  const sortedPalettesList = useMemo(
    () => [...palettesList].sort((a, b) => a.localeCompare(b)),
    [palettesList]
  )

  if (sortedPalettesList.length === 0) {
    return (
      <EmptyState icon="colors-swatch" title={t("empty.title")}>
        {t("empty.text")}
      </EmptyState>
    )
  }

  return (
    <Grid placeholderItemHeight={260}>
      {sortedPalettesList.map((palette) => (
        <PaletteListItem
          key={palette}
          name={palette}
          onClick={() => setMode({ name: "selected", palette })}
        />
      ))}
    </Grid>
  )
}

export const PaletteListItem = ({
  name,
  onClick,
}: {
  name: string
  onClick: () => void
}) => {
  const paletteCode = useAtomValue(PaletteCodeSelectorFamily(name))
  const pocketPath = useAtomValue(pocketPathAtom)
  const [interimName, setInterimName] = useState(() => name.replace(".pal", ""))
  const { t } = useTranslation("palettes")
  const [renameMode, setRenameMode] = useState(false)

  const deletePalette = useCallback(async () => {
    await invokeDeleteFiles([`Assets/gb/common/Palettes${name}`])
  }, [name])

  const duplicatePalette = useCallback(async () => {
    await invokeCopyFiles([
      {
        origin: `${pocketPath}/Assets/gb/common/Palettes${name}`,
        destination: `${pocketPath}/Assets/gb/common/Palettes${name.replace(
          ".pal",
          "_copy.pal"
        )}`,
        exists: true,
      },
    ])
  }, [name, pocketPath])

  const renamePalette = useCallback(async () => {
    setRenameMode(false)
    const origin = `${pocketPath}/Assets/gb/common/Palettes/${name}`
    const destination = `${pocketPath}/Assets/gb/common/Palettes/${interimName}.pal`
    if (splitAsPath(origin).join("/") === splitAsPath(destination).join("/"))
      return

    await invokeCopyFiles([
      {
        origin,
        destination,
        exists: true,
      },
    ])
    await invokeDeleteFiles([`Assets/gb/common/Palettes/${name}`])
  }, [interimName, name, pocketPath])

  return (
    <Tile
      onClick={renameMode ? undefined : onClick}
      media={
        // Same shape as the preview, so the tile doesn't jump when it loads
        <Suspense fallback={<div className="palettes__preview-placeholder" />}>
          <PreviewCanvas name={name} />
        </Suspense>
      }
      title={
        renameMode ? (
          <div className="palettes__card-rename">
            <TextInput
              label={t("item.rename")}
              value={interimName}
              onChange={setInterimName}
              onKeyDown={({ key }) => {
                if (key === "Enter") renamePalette()
              }}
              autoFocus
            />
            <IconButton
              icon="check"
              label={t("item.rename")}
              onClick={renamePalette}
            />
          </div>
        ) : (
          <PaletteName name={name} />
        )
      }
      actions={
        <>
          <IconButton
            theme="tertiary"
            icon="copy"
            label={t("item.duplicate")}
            onClick={duplicatePalette}
          />
          <IconButton
            theme="tertiary"
            icon="code"
            label={t("item.copy_code")}
            onClick={() => writeText(paletteCode)}
          />
          <IconButton
            theme="tertiary"
            icon="pencil"
            label={t("item.rename")}
            onClick={() => {
              setInterimName(name.replace(".pal", ""))
              setRenameMode(true)
            }}
          />
          <IconButton
            icon="trash"
            theme="destructive"
            label={t("item.delete")}
            onClick={deletePalette}
            className="palettes__card-delete"
          />
        </>
      }
    />
  )
}

const AddViaCodeModal = ({ onClose }: { onClose: () => void }) => {
  const [inputedCode, setInputedCode] = useState("")
  const pocketPath = useAtomValue(pocketPathAtom)
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
      `${pocketPath}/Assets/gb/common/Palettes/${parsedPalette.name}`,
      parsedPalette.data
    )
    onClose()
  }, [onClose, parsedPalette, pocketPath])

  return (
    <Modal
      className="palettes_code-modal"
      title={t("add_via_code.title")}
      onClose={onClose}
    >
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
