export const decodeThumbnail = (file: Uint8Array) => {
  const imagePayloadSlice = file.slice(file.byteLength - 52756)
  const canvas = document.createElement("canvas")
  canvas.width = 122
  canvas.height = 145
  const context = canvas.getContext("2d") as CanvasRenderingContext2D
  const imageDataSwap = context.getImageData(0, 0, 1, 1)
  imageDataSwap.data[3] = 255
  let dataIndex = 0
  for (let x = 0; x < canvas.width - 1; x++) {
    for (let y = 0; y < canvas.height; y++) {
      const indexOffset = y % 4
      imageDataSwap.data[2] = imagePayloadSlice[indexOffset + dataIndex++]
      imageDataSwap.data[1] = imagePayloadSlice[indexOffset + dataIndex++]
      imageDataSwap.data[0] = imagePayloadSlice[indexOffset + dataIndex++]
      context.putImageData(imageDataSwap, canvas.width - x, y)
    }
    dataIndex++
  }
  return canvas.toDataURL()
}
