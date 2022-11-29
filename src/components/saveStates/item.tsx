import React from "react"
import { SaveStateBinarySelectorFamily } from "../../recoil/saveStates/selectors"
import { useRecoilValue } from "recoil"

const decodeThumbnail = (file: Uint8Array) => {
  const IPAyHeader = Array.from("IPAy").map((c) => c.charCodeAt(0))
  let foundIndex = 0

  fileloop: for (
    let index = 0;
    index < file.length - IPAyHeader.length;
    index++
  ) {
    const element = file[index]
    for (let headerIndex = 0; headerIndex < IPAyHeader.length; headerIndex++) {
      const element = IPAyHeader[headerIndex]
      if (file[index + headerIndex] !== IPAyHeader[headerIndex]) {
        continue fileloop
      }
      foundIndex = index
    }
  }
  const imagePayloadSlice = file.slice(file.byteLength - 52756)

  console.log({ imagePayloadSlice })

  const canvas = document.createElement("canvas")
  canvas.width = 122
  canvas.height = 145

  const context = canvas.getContext("2d") as CanvasRenderingContext2D

  let dataIndex = 0

  const imageDataSwap = context.getImageData(0, 0, 1, 1)
  imageDataSwap.data[3] = 255

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

export const SaveStateItem = ({ path }: { path: string }) => {
  const file = useRecoilValue(SaveStateBinarySelectorFamily(path))

  const src = decodeThumbnail(file)

  return (
    <div>
      {path}

      <img
        src={src}
        // width={"200%"}
        style={{ imageRendering: "pixelated" }}
      ></img>
    </div>
  )
}
