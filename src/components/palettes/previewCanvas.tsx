import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { PaletteColoursSelectorFamily } from "../../recoil/palettes/selectors"
import { useEffect, useRef } from "react"
import { Palette } from "../../types"

export const PreviewCanvas = ({ name }: { name: string }) => {
  const paletteColours = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PaletteColoursSelectorFamily(name)
  )

  return <PreviewCanvasInner palette={paletteColours} />
}

export const PreviewCanvasInner = ({ palette }: { palette: Palette }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext("2d")
    if (!context) return

    const imageData = context.getImageData(0, 0, 4, 5)

    palette.background
      .map((v) => [...v, 255])
      .flat()
      .forEach((v, index) => {
        imageData.data[index] = v
      })

    palette.obj0
      .map((v) => [...v, 255])
      .flat()
      .forEach((v, index) => {
        imageData.data[index + 16] = v
      })

    palette.obj1
      .map((v) => [...v, 255])
      .flat()
      .forEach((v, index) => {
        imageData.data[index + 32] = v
      })

    palette.window
      .map((v) => [...v, 255])
      .flat()
      .forEach((v, index) => {
        imageData.data[index + 48] = v
      })

    context.putImageData(imageData, 0, 0)
    context.fillStyle = `rgb(${palette.off.join(",")})`
    context.fillRect(0, 4, 4, 1)
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
      width={4}
      height={5}
    ></canvas>
  )
}
