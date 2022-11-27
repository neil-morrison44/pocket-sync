import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { ImageBinSrcSelectorFamily } from "../../../../recoil/selectors"

import { open, OpenDialogOptions } from "@tauri-apps/api/dialog"
import { readBinaryFile, BaseDirectory } from "@tauri-apps/api/fs"

import { Modal } from "../../../modal"

import "./index.css"
import { invokeSaveFile } from "../../../../utils/invokes"
import {
  fileSystemInvalidationAtom,
  pocketPathAtom,
} from "../../../../recoil/atoms"

type ImageEditorProps = {
  onClose: () => void
  path: string
  width: number
  height: number
}

export const ImageEditor = ({
  onClose,
  path,
  width,
  height,
}: ImageEditorProps) => {
  const currentImageSrc = useRecoilValue(
    ImageBinSrcSelectorFamily({ path, width, height })
  )
  const pocketPath = useRecoilValue(pocketPathAtom)
  const invalidateFS = useSetRecoilState(fileSystemInvalidationAtom)
  const [selectedStampIndex, setSelectedStampIndex] = useState(0)
  const [imageStamps, setImageStamps] = useState<ImageInfo[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    ;(async () => {
      if (imageStamps.length !== 0) return
      const image = new Image()
      image.src = currentImageSrc
      await new Promise((resolve) => (image.onload = resolve))

      setImageStamps([
        {
          x: 0,
          y: 0,
          src: currentImageSrc,
          scale: 1,
          rotate: 0,
          image,
        },
      ])
    })()
  }, [setImageStamps, currentImageSrc])

  useEffect(() => {
    if (!canvasRef.current) return
    let mouseDown = false

    canvasRef.current.onmousedown = () => (mouseDown = true)
    canvasRef.current.onmouseup = () => (mouseDown = false)
    canvasRef.current.onmouseout = () => (mouseDown = false)

    canvasRef.current.onmousemove = (e) => {
      if (!mouseDown) return

      setImageStamps((stamps) => {
        const stamp = stamps[selectedStampIndex]
        const currentIndex = stamps.findIndex((i) => i === stamp)
        const updated = {
          ...stamp,
          x: stamp.x + e.movementX,
          y: stamp.y + e.movementY,
        }

        const newStamps = [...stamps]
        newStamps.splice(currentIndex, 1, updated)
        return newStamps
      })
    }
  }, [selectedStampIndex, setImageStamps, canvasRef])

  useEffect(() => {
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext("2d")
    if (!context) return

    context.fillStyle = "white"
    context.fillRect(0, 0, width, height)

    const reversed = [...imageStamps].reverse()

    context.globalCompositeOperation = "luminosity"

    reversed.forEach((i) => {
      context.save()
      const { image, scale, x, y, rotate } = i

      context.translate(width / 2 + x, height / 2 + y)
      context.rotate(rotate * (Math.PI / 180))
      context.translate(-(width / 2 + x), -(height / 2 + y))

      context.drawImage(
        i.image,
        width / 2 + x - (image.width / 2) * scale,
        height / 2 + y - (image.height / 2) * scale,
        image.width * scale,
        image.height * scale
      )
      context.restore()
    })
  }, [imageStamps])

  const updateImageStampValues = useCallback(
    (stamp: ImageInfo, updates: Partial<ImageInfo>) => {
      setImageStamps((stamps) => {
        const currentIndex = stamps.findIndex((i) => i === stamp)
        const updated = { ...stamp, ...updates }

        const newStamps = [...stamps]
        newStamps.splice(currentIndex, 1, updated)
        return newStamps
      })
    },
    [setImageStamps]
  )

  const addNewImage = useCallback(async () => {
    const options: OpenDialogOptions = {
      multiple: false,
      filters: [
        {
          name: "Image",
          extensions: ["png", "jpeg", "jpg"],
        },
      ],
    }
    const imagePath = await open(options)

    if (!imagePath || Array.isArray(imagePath)) return
    const imageData = await readBinaryFile(imagePath)

    const [name] = imagePath.split("/").reverse()
    const file = new File([imageData], name)

    const url = await URL.createObjectURL(file)
    const image = new Image()
    image.src = url
    await new Promise((resolve) => (image.onload = resolve))

    setImageStamps((stamps) => {
      return [
        {
          x: 0,
          y: 0,
          src: url,
          scale: 1,
          rotate: 0,
          image: image,
        },
        ...stamps,
      ]
    })
  }, [])

  const saveBinary = useCallback(async () => {
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext("2d")
    if (!context) return

    const imageData = context.getImageData(0, 0, width, height, {
      colorSpace: "srgb",
    })
    const buffer = new Uint8Array(width * height * 2)

    let index = 0
    for (let x = width - 1; x >= 0; x--) {
      for (let y = 0; y < height; y++) {
        const red = imageData.data[(x + y * width) * 4]
        buffer[index] = 255 - red
        index += 2
      }
    }

    await invokeSaveFile(`${pocketPath}/${path}`, buffer)

    invalidateFS(Date.now())

    onClose()
  }, [width, height])

  const moveStamp = useCallback(
    (stamp: ImageInfo, move: -1 | 1) => {
      setImageStamps((stamps) => {
        const currentIndex = stamps.findIndex((s) => s === stamp)
        const newStamps = stamps.filter((s) => s !== stamp)
        newStamps.splice(currentIndex + move, 0, stamp)
        return newStamps
      })

      setSelectedStampIndex((i) => i + move)
    },
    [setImageStamps, setSelectedStampIndex]
  )

  return (
    <Modal className="image-editor">
      <canvas
        className="image-editor__preview-canvas"
        width={width}
        height={height}
        ref={canvasRef}
      ></canvas>
      <div className="image-editor__stamps-etc">
        <div className="image-editor__stamps">
          {imageStamps.map((stamp, index) => {
            const selected = index === selectedStampIndex

            return (
              <div
                className={`image-editor__stamp image-editor__stamp--${
                  selected ? "selected" : "not-selected"
                }`}
                key={index}
                onMouseDown={() => setSelectedStampIndex(index)}
              >
                <img
                  className="image-editor__stamp-image"
                  src={stamp.src}
                  onClick={() => {
                    setSelectedStampIndex(index)
                  }}
                ></img>

                <div className="image-editor__stamp-controls">
                  {"Scale"}
                  <input
                    type="range"
                    className="image-editor__range"
                    max={5}
                    step={0.001}
                    min={0.001}
                    value={stamp.scale}
                    onChange={({ target }) =>
                      updateImageStampValues(stamp, {
                        scale: parseFloat(target.value),
                      })
                    }
                  ></input>
                  {"Rotate"}
                  <input
                    type="range"
                    className="image-editor__range"
                    max={180}
                    min={-180}
                    value={stamp.rotate}
                    onChange={({ target }) =>
                      updateImageStampValues(stamp, {
                        rotate: parseInt(target.value),
                      })
                    }
                  ></input>
                </div>

                <div className="image-editor__stamp-controls">
                  <button
                    onClick={() => {
                      setImageStamps((stamps) =>
                        stamps.filter((s) => s !== stamp)
                      )
                    }}
                  >
                    Remove
                  </button>
                  <button
                    onClick={() =>
                      updateImageStampValues(stamp, {
                        y: 0,
                        x: 0,
                        scale: 1,
                        rotate: 0,
                      })
                    }
                  >
                    Reset
                  </button>
                </div>
                <div className="image-editor__stamp-controls">
                  {index !== 0 && (
                    <button
                      className="image-editor__layer-move-button image-editor__layer-move-button--up"
                      onClick={() => moveStamp(stamp, -1)}
                    ></button>
                  )}
                  {index !== imageStamps.length - 1 && (
                    <button
                      className="image-editor__layer-move-button image-editor__layer-move-button--down"
                      onClick={() => moveStamp(stamp, 1)}
                    ></button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={addNewImage}>Import Image</button>
      </div>
      <div className="image-editor__bottom-buttons">
        <button onClick={saveBinary}>Save</button>
        <button className="image-editor__close-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}

type ImageInfo = {
  src: string
  x: number
  y: number
  scale: number
  rotate: number
  image: HTMLImageElement
}
