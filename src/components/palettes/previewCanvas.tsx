import { useRecoilValue } from "recoil"
import { PaletteColoursSelectorFamily } from "../../recoil/palettes/selectors"
import { useEffect, useRef } from "react"

export const PreviewCanvas = ({ name }: { name: string }) => {
  const paletteColours = useRecoilValue(PaletteColoursSelectorFamily(name))
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
  }, [
    paletteColours.background,
    paletteColours.obj0,
    paletteColours.obj1,
    paletteColours.off,
    paletteColours.window,
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
