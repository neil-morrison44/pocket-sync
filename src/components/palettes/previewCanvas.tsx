import { PaletteColoursKeptSelectorFamily } from "../../jotai/palettes/selectors"
import { useEffect, useRef } from "react"
import { Palette } from "../../types"
import { useAtomValue } from "jotai"

export const PreviewCanvas = ({ name }: { name: string }) => {
  const paletteColours = useAtomValue(PaletteColoursKeptSelectorFamily(name))

  return <PreviewCanvasInner palette={paletteColours} />
}

export const PreviewCanvasInner = ({ palette }: { palette: Palette }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Drawn at 100 × 80, the shape it's shown at (5:4): each colour is a
  // whole-pixel rectangle, so no seams (or the white media background)
  // show between the rows when it's scaled. Rows: background, sprites 0
  // and 1, window (four shades each), then LCD off across the width.
  useEffect(() => {
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext("2d")
    if (!context) return

    const rows = [
      palette.background,
      palette.obj0,
      palette.obj1,
      palette.window,
    ]
    rows.forEach((colours, row) =>
      colours.forEach((colour, column) => {
        context.fillStyle = `rgb(${colour.join(",")})`
        context.fillRect(column * 25, row * 16, 25, 16)
      })
    )
    context.fillStyle = `rgb(${palette.off.join(",")})`
    context.fillRect(0, 64, 100, 16)
  }, [
    palette.background,
    palette.obj0,
    palette.obj1,
    palette.off,
    palette.window,
  ])

  return (
    <canvas
      className="palettes__list-item-canvas"
      ref={canvasRef}
      width={100}
      height={80}
    ></canvas>
  )
}
