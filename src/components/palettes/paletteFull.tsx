import { useRecoilValue } from "recoil"
import {
  GameBoyGameSelectorFamily,
  PaletteColoursSelectorFamily,
} from "../../recoil/palettes/selectors"
import { Palette, rgb } from "../../types"

import { Gameboy } from "@neil-morrison44/gameboy-emulator"
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react"
import { WalkDirSelectorFamily } from "../../recoil/selectors"
import { Loader } from "../loader"
import { useSavePalette } from "./hooks/useSavePalette"

type PaletteFullProps = {
  name: string
  onClose: () => void
}

export const PaletteFull = ({ name }: PaletteFullProps) => {
  const paletteColours = useRecoilValue(PaletteColoursSelectorFamily(name))
  const [tempPalette, setTempPalette] = useState(() => ({ ...paletteColours }))

  const games = useRecoilValue(
    WalkDirSelectorFamily({ path: `Assets/gb`, extensions: ["gb"] })
  )

  const savePalette = useSavePalette()

  const [selectedGame, setSelectedGame] = useState<string | null>(
    games[0] || null
  )

  console.log({ games })

  return (
    <div className="palette__grid">
      <div className="palette__preview">
        <select
          value={selectedGame || undefined}
          onChange={({ target }) => setSelectedGame(target.value)}
        >
          {games.map((g) => (
            <option value={g} key={g}>
              {g}
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
      <div className="palette__inputs">
        <div className="palette__inputs-name">{name}</div>

        <PaletteInput
          title={"Background"}
          colours={tempPalette.background}
          onChange={(background) =>
            setTempPalette((t) => ({ ...t, background }))
          }
        />
        <PaletteInput
          title={"Obj0"}
          colours={tempPalette.obj0}
          onChange={(obj0) => setTempPalette((t) => ({ ...t, obj0 }))}
        />
        <PaletteInput
          title={"Obj1"}
          colours={tempPalette.obj1}
          onChange={(obj1) => setTempPalette((t) => ({ ...t, obj1 }))}
        />
        <PaletteInput
          title={"Window"}
          colours={tempPalette.window}
          onChange={(window) => setTempPalette((t) => ({ ...t, window }))}
        />

        <PaletteInput
          title={"Off"}
          colours={[tempPalette.off]}
          onChange={([off]) => setTempPalette((t) => ({ ...t, off }))}
        />
        <div className="palette__inputs-buttons">
          <button onClick={() => savePalette(tempPalette, name)}>Save</button>
          <button onClick={() => setTempPalette(paletteColours)}>Reset</button>
        </div>
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
                colours.map((c, i) => (i === index ? newColours : c)) as [
                  rgb,
                  rgb,
                  rgb,
                  rgb
                ]
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
  const gameData = useRecoilValue(GameBoyGameSelectorFamily(game))

  useLayoutEffect(() => {
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext("2d")
    if (!context) return
    const gameboy = new Gameboy({ sound: false })
    gameboyRef.current = gameboy

    gameboy.onFrameFinished((imageData: ImageData) => {
      context.putImageData(imageData, 0, 0)
    })

    gameboy.loadGame(gameData.buffer)
    // gameboy.apu.disableSound()
    gameboy.run()

    return () => gameboy.stop()
  }, [gameData.buffer])

  useEffect(() => {
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
  }, [palette])

  return (
    <canvas
      className="palette__emu-canvas"
      width={160}
      height={144}
      ref={canvasRef}
    ></canvas>
  )
}
