/** Columns stored in a save state's thumbnail (each 145 BGR pixels + 1). */
const STORED_COLUMNS = 121
const HEIGHT = 145

export const decodeThumbnail = (file: Uint8Array) => {
  const imagePayloadSlice = file.slice(file.byteLength - 52756)
  const canvas = document.createElement("canvas")
  // The first stored column isn't shown (it was always drawn off-canvas);
  // the canvas is as wide as the columns that are, so no empty strip is
  // left at the left edge
  canvas.width = STORED_COLUMNS - 1
  canvas.height = HEIGHT
  const context = canvas.getContext("2d") as CanvasRenderingContext2D
  const imageDataSwap = context.getImageData(0, 0, 1, 1)
  imageDataSwap.data[3] = 255
  let dataIndex = 0
  // Columns are stored right to left
  for (let x = 0; x < STORED_COLUMNS; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      const indexOffset = y % 4
      imageDataSwap.data[2] = imagePayloadSlice[indexOffset + dataIndex++]
      imageDataSwap.data[1] = imagePayloadSlice[indexOffset + dataIndex++]
      imageDataSwap.data[0] = imagePayloadSlice[indexOffset + dataIndex++]
      if (x > 0) context.putImageData(imageDataSwap, canvas.width - x, y)
    }
    dataIndex++
  }
  return canvas.toDataURL()
}
