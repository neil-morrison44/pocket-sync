import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import {
  GameBoyGameSelectorFamily,
  PaletteColoursSelectorFamily,
} from "../../recoil/palettes/selectors"
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
import { WalkDirSelectorFamily } from "../../recoil/selectors"
import { Loader } from "../loader"
import { useSavePalette } from "./hooks/useSavePalette"
import { Link } from "../link"
import { PaletteName } from "./name"
import { Trans, useTranslation } from "react-i18next"

type PaletteFullProps = {
  name: string
  onClose: () => void
}

export const PaletteFull = ({ name }: PaletteFullProps) => {
  const paletteColours = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PaletteColoursSelectorFamily(name)
  )
  const { t } = useTranslation("palettes")
  const [tempPalette, setTempPalette] = useState(() => paletteColours)
  const hasBeenChanged = useMemo(
    () => !comparePalettes(tempPalette, paletteColours),
    [tempPalette, paletteColours]
  )
  const games = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    WalkDirSelectorFamily({ path: `Assets/gb`, extensions: ["gb"] })
  )
  const savePalette = useSavePalette()
  const [selectedGame, setSelectedGame] = useState<string | null>(
    games[0] || null
  )

  return (
    <div className="palette__grid">
      <div className="palette__name">
        <PaletteName name={name} />
      </div>
      <div className="palette__preview">
        <select
          value={selectedGame || undefined}
          onChange={({ target }) => setSelectedGame(target.value)}
        >
          {games.map((g) => (
            <option value={g} key={g}>
              {g.replace("/common/", "").replace("\\common\\", "")}
            </option>
          ))}
        </select>
        {selectedGame && (
          <Suspense fallback={<Loader />}>
            <GameboyEmu
              game={selectedGame}
              key={selectedGame}
              palette={tempPalette}
            />
          </Suspense>
        )}
      </div>
      <div className="palette__credits">
        <Trans t={t} i18nKey={"full.emu_credit"}>
          {"_"}
          <Link href="https://github.com/roblouie/gameboy-emulator">{"_"}</Link>
        </Trans>
      </div>
      <div className="palette__inputs">
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
        {hasBeenChanged && (
          <div className="palette__inputs-buttons">
            <button onClick={() => savePalette(tempPalette, name)}>
              {t("full.save")}
            </button>
            <button onClick={() => setTempPalette(paletteColours)}>
              {t("full.reset")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

type PaletteInputProps<T> = {
  title: string
  colours: T
  onChange: (newColours: T) => void
}

const PaletteInput = <T extends [rgb, rgb, rgb, rgb] | [rgb]>({
  title,
  colours,
  onChange,
}: PaletteInputProps<T>) => {
  return (
    <div className="palette__inputs-set">
      <div className="palette__inputs-set-title">{title}</div>
      <div>
        {colours.map((colour, index) => (
          <input
            type="color"
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
  const gameData = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    GameBoyGameSelectorFamily(game)
  )

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
