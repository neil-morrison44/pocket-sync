export const renderBinImage = (
  image: Uint8Array,
  width: number,
  height: number,
  invert: boolean
): string => {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Failed to get canvas context")

  // not sure why this should be 1px wider than it should be
  // but it fixes an off-by-one error so it'll do
  canvas.width = width + 1
  canvas.height = height

  let index = 0
  for (let x = width; x >= 0; x--) {
    for (let y = 0; y < height; y++) {
      const value = image[index]
      const brightness = invert ? 255 - value : value

      context.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`
      context.fillRect(x, y, 1, 1)

      index = index + 2
    }
  }

  return canvas.toDataURL()
}
