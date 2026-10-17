import Slider from "../../../ui/Slider"
import { useCallback, useEffect, useRef, useState } from "react"
import { confirm } from "@tauri-apps/plugin-dialog"

import { ImageBinSrcSelectorFamily } from "../../../../jotai/selectors"
import Button from "../../../ui/Button"
import IconButton from "../../../ui/IconButton"
import { Modal, ModalSuspense } from "../../../modal"
import { invokeSaveFile } from "../../../../utils/invokes"
import { pocketPathAtom } from "../../../../jotai/atoms"
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

const ImageEditorContent = ({
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

  // The layers as opened, to tell whether anything was changed since
  const openedStampsRef = useRef<ImageInfo[] | null>(null)
  useEffect(() => {
    if (!openedStampsRef.current && imageStamps.length > 0)
      openedStampsRef.current = imageStamps
  }, [imageStamps])

  // Closing (also by clicking outside or Escape) discards the changes, so
  // it asks first when there are any
  const requestClose = useCallback(async () => {
    const opened = openedStampsRef.current
    if (opened === null || opened === imageStamps) return onClose()
    const discard = await confirm(t("discard_confirm"), {
      kind: "warning",
      okLabel: t("discard"),
      cancelLabel: t("keep_editing"),
    })
    if (discard) onClose()
  }, [imageStamps, onClose, t])

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
    <Modal className="image-editor" title={t("title")} onClose={requestClose}>
      <canvas
        className="image-editor__preview-canvas"
        width={width}
        height={height}
        ref={canvasRef}
      ></canvas>
      <p className="image-editor__hint">
        {imageStamps.length === 0 ? t("hint_empty") : t("hint")}
      </p>

      {/* One row per image layer, top layer first */}
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
                alt=""
                onClick={() => setSelectedStampIndex(index)}
              ></img>

              {/* Position too, not only by dragging: exact, and by keyboard */}
              <div className="image-editor__sliders">
                <Slider
                  label={t("scale")}
                  min={0.01}
                  max={5}
                  step={0.01}
                  value={stamp.scale}
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                  onChange={(scale) => updateImageStampValues(stamp, { scale })}
                />
                <Slider
                  label={t("rotate")}
                  min={-180}
                  max={180}
                  value={stamp.rotate}
                  formatValue={(v) => `${v}°`}
                  onChange={(rotate) =>
                    updateImageStampValues(stamp, { rotate })
                  }
                />
                <Slider
                  label={t("position_x")}
                  min={-width}
                  max={width}
                  value={Math.round(stamp.x)}
                  formatValue={(v) => `${v} px`}
                  onChange={(x) => updateImageStampValues(stamp, { x })}
                />
                <Slider
                  label={t("position_y")}
                  min={-height}
                  max={height}
                  value={Math.round(stamp.y)}
                  formatValue={(v) => `${v} px`}
                  onChange={(y) => updateImageStampValues(stamp, { y })}
                />
              </div>

              <div className="image-editor__stamp-actions">
                <IconButton
                  icon="chevron-up"
                  theme="tertiary"
                  label={t("move_up")}
                  disabled={index === 0}
                  onClick={() => moveStamp(stamp, -1)}
                />
                <IconButton
                  icon="chevron-down"
                  theme="tertiary"
                  label={t("move_down")}
                  disabled={index === imageStamps.length - 1}
                  onClick={() => moveStamp(stamp, 1)}
                />
                <Button
                  theme="tertiary"
                  icon="reload"
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
                </Button>
                {/* Labelled: an icon alone didn't say what it removes */}
                <Button
                  icon="trash"
                  theme="destructive"
                  onClick={() => {
                    setImageStamps((stamps) =>
                      stamps.filter((s) => s !== stamp)
                    )
                    // Keeps the selection on a layer that's still there
                    setSelectedStampIndex((selected) =>
                      Math.max(
                        0,
                        Math.min(
                          selected > index ? selected - 1 : selected,
                          imageStamps.length - 2
                        )
                      )
                    )
                  }}
                >
                  {t("remove")}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Import on the left; Cancel and Save on the right */}
      <div className="image-editor__buttons">
        <Button icon="folder-plus" onClick={addNewImage}>
          {t("import_image")}
        </Button>
        <Button theme="tertiary" onClick={requestClose}>
          {t("cancel")}
        </Button>
        <Button theme="primary" icon="save" onClick={saveBinary}>
          {t("save")}
        </Button>
      </div>
    </Modal>
  )
}

/** Opens right away with a loader while its data loads. */
export const ImageEditor = (props: ImageEditorProps) => {
  const { t } = useTranslation("image_editor")
  return (
    <ModalSuspense
      className="image-editor"
      title={t("title")}
      onClose={props.onClose}
    >
      <ImageEditorContent {...props} />
    </ModalSuspense>
  )
}
