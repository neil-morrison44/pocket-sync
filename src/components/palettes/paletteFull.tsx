import {
  GameBoyGameSelectorFamily,
  PaletteCodeKeptSelectorFamily,
  PaletteColoursKeptSelectorFamily,
  paletteGamesSelector,
} from "../../jotai/palettes/selectors"
import { Palette, rgb } from "../../types"

import { Gameboy } from "@neil-morrison44/gameboy-emulator"
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Loader } from "../loader"
import { useSavePalette } from "./hooks/useSavePalette"
import { Link } from "../link"
import { Trans, useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"
import { DetailHeading } from "../shared/detailPage"
import { Controls, ControlsActions } from "../controls"
import { ControlsBackButton } from "../controls/inputs/backButton"
import { ControlsButton } from "../controls/inputs/button"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import Select from "../ui/Select"
import Callout from "../ui/Callout"
import { gameDisplayName } from "../../utils/gameName"
import { splitAsPath } from "../../utils/splitAsPath"
import { PreviewCanvasInner } from "./previewCanvas"
import {
  paletteBaseName,
  paletteFolders,
  usePaletteActions,
} from "./hooks/usePaletteActions"

type PaletteFullProps = {
  name: string
  onClose: () => void
  /** Called with the new name after the palette is renamed. */
  onRenamed: (newName: string) => void
}

/**
 * One palette: its name (edited in place), the actions in the header, a
 * game running with the palette on the left, the colours on the right.
 */
export const PaletteFull = ({ name, onClose, onRenamed }: PaletteFullProps) => {
  const paletteColours = useAtomValue(PaletteColoursKeptSelectorFamily(name))
  const paletteCode = useAtomValue(PaletteCodeKeptSelectorFamily(name))
  const { t } = useTranslation("palettes")
  const [tempPalette, setTempPalette] = useState(() => paletteColours)
  const hasBeenChanged = useMemo(
    () => !comparePalettes(tempPalette, paletteColours),
    [tempPalette, paletteColours]
  )
  const savePalette = useSavePalette()
  const { duplicate, rename, remove } = usePaletteActions(name)

  return (
    <div className="detail-page palette-detail">
      {/* Always shown (the page is short, so a bar that appears on scroll
          wouldn't), with the palette's actions as full buttons */}
      <Controls>
        <ControlsBackButton onClick={onClose}>
          {t("buttons.back")}
        </ControlsBackButton>
        <ControlsActions>
          <ControlsButton icon="code" onClick={() => writeText(paletteCode)}>
            {t("item.copy_code")}
          </ControlsButton>
          <ControlsButton icon="copy" onClick={duplicate}>
            {t("item.duplicate")}
          </ControlsButton>
          <ControlsButton
            theme="destructive"
            icon="trash"
            onClick={async () => {
              await remove()
              onClose()
            }}
          >
            {t("item.delete")}
          </ControlsButton>
        </ControlsActions>
      </Controls>
      <div className="detail-page__content">
        <DetailHeading
          title={
            <PaletteNameInput
              name={name}
              onRename={async (baseName) => {
                const newName = await rename(baseName)
                if (newName) onRenamed(newName)
              }}
            />
          }
        />

        <div className="palette-detail__layout">
          <section className="palette-detail__preview">
            <Suspense fallback={<Loader />}>
              <GamePreview palette={tempPalette} />
            </Suspense>
            <p className="palette-detail__credit">
              <Trans t={t} i18nKey={"full.emu_credit"}>
                {"_"}
                <Link href="https://github.com/roblouie/gameboy-emulator">
                  {"_"}
                </Link>
              </Trans>
            </p>
          </section>

          <section className="palette-detail__colours">
            <PaletteInput
              title={t("full.inputs.background")}
              colours={tempPalette.background}
              onChange={(background) =>
                setTempPalette((t) => ({ ...t, background }))
              }
            />
            <PaletteInput
              title={t("full.inputs.obj0")}
              colours={tempPalette.obj0}
              onChange={(obj0) => setTempPalette((t) => ({ ...t, obj0 }))}
            />
            <PaletteInput
              title={t("full.inputs.obj1")}
              colours={tempPalette.obj1}
              onChange={(obj1) => setTempPalette((t) => ({ ...t, obj1 }))}
            />
            <PaletteInput
              title={t("full.inputs.window")}
              colours={tempPalette.window}
              onChange={(window) => setTempPalette((t) => ({ ...t, window }))}
            />
            <PaletteInput
              title={t("full.inputs.off")}
              colours={[tempPalette.off]}
              onChange={([off]) => setTempPalette((t) => ({ ...t, off }))}
            />
            <div className="palette-detail__buttons">
              <Button
                theme="tertiary"
                disabled={!hasBeenChanged}
                onClick={() => setTempPalette(paletteColours)}
              >
                {t("full.reset")}
              </Button>
              <Button
                theme="primary"
                disabled={!hasBeenChanged}
                onClick={() => savePalette(tempPalette, name)}
              >
                {t("full.save")}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/**
 * The palette's name as the page title, editable in place: Enter or leaving
 * the field renames the file, Escape undoes the edit. Folders show above it;
 * a long name scrolls inside the field instead of widening the page.
 */
const PaletteNameInput = ({
  name,
  onRename,
}: {
  name: string
  onRename: (baseName: string) => Promise<void>
}) => {
  const { t } = useTranslation("palettes")
  const [value, setValue] = useState(() => paletteBaseName(name))
  const folders = paletteFolders(name)

  useEffect(() => setValue(paletteBaseName(name)), [name])

  const commit = () => {
    if (value.trim() && value.trim() !== paletteBaseName(name)) onRename(value)
    else setValue(paletteBaseName(name))
  }

  return (
    <span className="palette-detail__name">
      {/* The folders it's in, small above the name; only the name is edited */}
      {folders.length > 0 && (
        <span className="palette-detail__folders">{folders.join(" / ")}</span>
      )}
      <span className="palette-detail__name-row">
        <input
          className="palette-detail__name-input"
          aria-label={t("item.rename")}
          value={value}
          size={Math.max(value.length, 1)}
          spellCheck={false}
          onChange={({ target }) =>
            setValue(target.value.replace(/[\\/]/g, ""))
          }
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
            if (event.key === "Escape") {
              // Undoes the edit instead of leaving the page
              event.stopPropagation()
              setValue(paletteBaseName(name))
              requestAnimationFrame(() => event.currentTarget?.blur())
            }
          }}
        />
        <Icon icon="pencil" className="palette-detail__name-icon" />
      </span>
    </span>
  )
}

/**
 * A game from `Assets/gb` running with the palette, chosen in a select;
 * without games, a hint where to put one.
 */
const GamePreview = ({ palette }: { palette: Palette }) => {
  const { t } = useTranslation("palettes")
  const games = useAtomValue(paletteGamesSelector)
  const [selectedGame, setSelectedGame] = useState<string | null>(
    games[0] || null
  )

  if (games.length === 0 || !selectedGame) {
    return (
      <>
        <PreviewCanvasInner palette={palette} />
        <Callout className="palette-detail__no-games">
          {t("full.no_games")}
        </Callout>
      </>
    )
  }

  return (
    <>
      <Suspense fallback={<div className="palette__emu-canvas" />}>
        <GameboyEmu game={selectedGame} key={selectedGame} palette={palette} />
      </Suspense>
      {/* Below the game, no wider than it */}
      <Select
        className="palette-detail__game-select"
        label={t("full.preview_game")}
        value={selectedGame}
        onChange={setSelectedGame}
        searchable={games.length > 8}
        options={games.map((g) => ({
          value: g,
          label: gameDisplayName(splitAsPath(g).at(-1) ?? g),
        }))}
      />
    </>
  )
}

type PaletteInputProps<T> = {
  title: string
  colours: T
  onChange: (newColours: T) => void
}

/** One colour set: its name, then a swatch per colour (a colour picker). */
const PaletteInput = <T extends [rgb, rgb, rgb, rgb] | [rgb]>({
  title,
  colours,
  onChange,
}: PaletteInputProps<T>) => {
  return (
    <div className="palette-detail__set">
      <div className="palette-detail__set-title">{title}</div>
      <div className="palette-detail__swatches">
        {colours.map((colour, index) => (
          <input
            className="palette-detail__swatch"
            type="color"
            aria-label={colours.length > 1 ? `${title} ${index + 1}` : title}
            value={`#${colour
              .map((c) => c.toString(16).padStart(2, "0"))
              .join("")}`}
            key={index}
            onChange={({ target }) => {
              const { value } = target

              const newColours = [
                value.substring(1, 3),
                value.substring(3, 5),
                value.substring(5, 8),
              ].map((s) => parseInt(s, 16)) as rgb

              onChange(
                colours.map((c, i) => (i === index ? newColours : c)) as T
              )
            }}
          ></input>
        ))}
      </div>
    </div>
  )
}

type GameboyEmuProps = {
  game: string
  palette: Palette
}

const GameboyEmu = ({ game, palette }: GameboyEmuProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameboyRef = useRef<Gameboy | null>(null)
  const gameData = useAtomValue(GameBoyGameSelectorFamily(game))

  const applyPalette = useCallback((palette: Palette) => {
    if (!gameboyRef.current) return
    gameboyRef.current.gpu.backgroundPalette = palette.background.map(
      ([red, green, blue]) => ({ red, green, blue })
    )
    gameboyRef.current.gpu.obj0Palette = palette.obj0.map(
      ([red, green, blue]) => ({ red, green, blue })
    )
    gameboyRef.current.gpu.obj1Palette = palette.obj1.map(
      ([red, green, blue]) => ({ red, green, blue })
    )
    gameboyRef.current.gpu.windowPalette = palette.window.map(
      ([red, green, blue]) => ({ red, green, blue })
    )
    const [red, green, blue] = palette.off
    gameboyRef.current.gpu.offColour = { red, green, blue }
  }, [])

  useLayoutEffect(() => {
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext("2d")
    if (!context) return
    const gameboy = new Gameboy({ sound: false })
    gameboyRef.current = gameboy

    gameboy.onFrameFinished((imageData: ImageData) => {
      context.putImageData(imageData, 0, 0)
    })

    gameboy.loadGame(gameData.buffer as ArrayBuffer)
    applyPalette(palette)
    gameboy.run()
    return () => gameboy.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyPalette, gameData.buffer])

  useEffect(() => {
    if (!gameboyRef.current) return
    applyPalette(palette)
  }, [applyPalette, palette])

  return (
    <canvas
      className="palette__emu-canvas"
      width={160}
      height={144}
      ref={canvasRef}
    ></canvas>
  )
}

const comparePalettes = (a: Palette, b: Palette) =>
  Object.entries(a).every(([key, value]) => {
    const aValues = value.flat()
    //@ts-ignore
    const bValues = b[key].flat()

    return aValues.every((av, index) => av === bValues[index])
  })
