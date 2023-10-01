export const renderBinImage = (
  image: Uint8Array,
  width: number,
  height: number,
  invert: boolean
): string => {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Failed to get canvas context")

  canvas.width = width
  canvas.height = height

  let index = 0
  for (let x = width - 1; x >= 0; x--) {
    for (let y = 0; y < height; y++) {
      const value = image[index]
      const brightness = invert ? 255 - value : value

      context.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`
      context.fillRect(x, y, 1, 1)

      index = index + 2
    }
  }

  // Little workaround for the white lines, detects if the last column is all white then repeats the 2nd last one
  // Can hopefully remove this at some point

  // const lastLineData = context.getImageData(width - 1, 0, 1, height)
  // if (lastLineData.data.every((v) => v === 255)) {
  //   const secondLastLineData = context.getImageData(width - 2, 0, 1, height)
  //   context.putImageData(secondLastLineData, width - 1, 0)
  // }

  return canvas.toDataURL()
}
