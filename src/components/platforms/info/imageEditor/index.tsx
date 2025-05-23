import { useCallback, useRef, useState } from "react"

import { ImageBinSrcSelectorFamily } from "../../../../recoil/selectors"
import { Modal } from "../../../modal"
import { invokeSaveFile } from "../../../../utils/invokes"
import { pocketPathAtom } from "../../../../recoil/atoms"
import { ImageInfo } from "./types"
import {
  useRenderStamps,
  useAddNewImageCallback,
  useCanvasToDragStamps,
  useMoveStampCallback,
  useSetCurrentImageAsStamp,
  useUpdateImageStampValuesCallback,
} from "./hooks/stamps"

import "./index.css"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"

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
  const currentImageSrc = useAtomValue(
    ImageBinSrcSelectorFamily({ path, width, height })
  )
  const pocketPath = useAtomValue(pocketPathAtom)
  const [selectedStampIndex, setSelectedStampIndex] = useState(0)
  const [imageStamps, setImageStamps] = useState<ImageInfo[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { t } = useTranslation("image_editor")

  useSetCurrentImageAsStamp(imageStamps, currentImageSrc, setImageStamps)
  useCanvasToDragStamps(canvasRef, setImageStamps, selectedStampIndex)
  useRenderStamps(canvasRef, width, height, imageStamps)

  const updateImageStampValues =
    useUpdateImageStampValuesCallback(setImageStamps)
  const addNewImage = useAddNewImageCallback(setImageStamps)
  const moveStamp = useMoveStampCallback(setImageStamps, setSelectedStampIndex)

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
    onClose()
  }, [width, height, pocketPath, path, onClose])

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
                  {t("scale")}
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
                  {t("rotate")}
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
                  <div
                    className="image-editor__stamp-control"
                    onClick={() => {
                      setImageStamps((stamps) =>
                        stamps.filter((s) => s !== stamp)
                      )
                    }}
                  >
                    {t("remove")}
                  </div>
                  <div
                    className="image-editor__stamp-control"
                    onClick={() =>
                      updateImageStampValues(stamp, {
                        y: 0,
                        x: 0,
                        scale: 1,
                        rotate: 0,
                      })
                    }
                  >
                    {t("reset")}
                  </div>
                </div>
                <div className="image-editor__stamp-controls">
                  {index !== 0 && (
                    <div
                      className="image-editor__layer-move-button image-editor__layer-move-button--up"
                      onClick={() => moveStamp(stamp, -1)}
                    ></div>
                  )}
                  {index !== imageStamps.length - 1 && (
                    <div
                      className="image-editor__layer-move-button image-editor__layer-move-button--down"
                      onClick={() => moveStamp(stamp, 1)}
                    ></div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={addNewImage}>{t("import_image")}</button>
      </div>
      <div className="image-editor__bottom-buttons">
        <button onClick={saveBinary}>{t("save")}</button>
        <button className="image-editor__close-button" onClick={onClose}>
          {t("cancel")}
        </button>
      </div>
    </Modal>
  )
}
