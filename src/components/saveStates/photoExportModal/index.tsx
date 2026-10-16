import { Modal, ModalSuspense } from "../../modal"
import { PhotoExportImageSelectorFamily } from "../../../jotai/saveStates/selectors"
import { Suspense, useState } from "react"

import "./index.css"
import { ColourMap, PhotoColourMapAtom } from "../../../jotai/saveStates/atoms"
import { useExportPhotos } from "./hooks/exportPhotos"
import { useTranslation } from "react-i18next"
import { useAtom, useAtomValue } from "jotai"
import { atom } from "jotai"
import { atomFamily } from "jotai-family"
import clsx from "clsx"
import Button from "../../ui/Button"
import Skeleton from "../../ui/Skeleton"

/** The Game Boy Camera keeps 30 photos in its save. */
const PHOTO_COUNT = 30

/** The colour presets: four shades, light to dark. */
const PRESETS: { key: string; colours: ColourMap }[] = [
  {
    key: "gb",
    colours: [
      [155, 188, 15],
      [139, 172, 15],
      [48, 98, 48],
      [15, 56, 15],
    ],
  },
  {
    key: "gb_player",
    colours: [
      [255, 255, 255],
      [255, 192, 0],
      [160, 96, 0],
      [0, 0, 0],
    ],
  },
  {
    key: "black_and_white",
    colours: [
      [255, 255, 255],
      [192, 192, 192],
      [96, 96, 96],
      [0, 0, 0],
    ],
  },
]

type PhotoExportModalProps = {
  /** The save state with the Game Boy Camera's photos. */
  path: string
  onClose: () => void
  /**
   * Development only (Settings → Developer): generated photos instead of a
   * save state's, so the modal can be looked at without a camera save.
   */
  demo?: boolean
}

/**
 * Game Boy Camera photos from a save state: the colours on top (presets or
 * four custom shades), the chosen photo large beside all 30, export below.
 */
const PhotoExportModalContent = ({
  path,
  onClose,
  demo = false,
}: PhotoExportModalProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const exportPhotos = useExportPhotos()
  // The demo's generated photos export like real ones
  const photoAtom = (index: number) =>
    demo
      ? DemoPhotoSelectorFamily(index)
      : PhotoExportImageSelectorFamily({ path, index })
  const { t } = useTranslation("save_states")

  return (
    <Modal
      className="photo-export-modal"
      title={t("photos.title")}
      onClose={onClose}
    >
      <ColourMapPicker />
      <div className="photo-export-modal__layout">
        <div className="photo-export-modal__large">
          <Suspense
            fallback={<Skeleton className="photo-export-modal__skeleton" />}
          >
            <Photo index={selectedIndex} path={path} demo={demo} />
          </Suspense>
          <span className="photo-export-modal__caption">
            {t("photos.photo_number", {
              number: selectedIndex + 1,
              total: PHOTO_COUNT,
            })}
          </span>
        </div>
        <div
          className="photo-export-modal__image-grid"
          role="listbox"
          aria-label={t("photos.title")}
        >
          {Array.from({ length: PHOTO_COUNT }, (_, index) => (
            <button
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              aria-label={t("photos.photo_number", {
                number: index + 1,
                total: PHOTO_COUNT,
              })}
              key={index + path}
              className={clsx(
                "photo-export-modal__thumb",
                index === selectedIndex && "photo-export-modal__thumb--selected"
              )}
              onClick={() => setSelectedIndex(index)}
            >
              <Suspense
                fallback={<Skeleton className="photo-export-modal__skeleton" />}
              >
                <Photo index={index} path={path} demo={demo} />
              </Suspense>
            </button>
          ))}
        </div>
      </div>

      <div className="modal__actions">
        <Button
          icon="download"
          onClick={() => exportPhotos(photoAtom, selectedIndex)}
        >
          {t("photos.export_selected")}
        </Button>
        <Button
          theme="primary"
          icon="download"
          onClick={() => exportPhotos(photoAtom)}
        >
          {t("photos.export_all")}
        </Button>
      </div>
    </Modal>
  )
}

const sameColours = (a: ColourMap, b: ColourMap) =>
  a.every((colour, index) =>
    colour.every((value, channel) => value === b[index][channel])
  )

/** Presets as a toggle group (the active one is marked), then custom. */
const ColourMapPicker = () => {
  const [colourMap, setColourMap] = useAtom(PhotoColourMapAtom)
  const { t } = useTranslation("save_states")

  return (
    <div className="photo-export-modal__palette-bar">
      <div
        className="photo-export-modal__presets"
        role="group"
        aria-label={t("photos.palette")}
      >
        <span className="photo-export-modal__label">{t("photos.palette")}</span>
        {PRESETS.map(({ key, colours }) => {
          const active = sameColours(colourMap, colours)
          return (
            <Button
              key={key}
              theme={active ? "primary" : "secondary"}
              aria-pressed={active}
              onClick={() => setColourMap(colours)}
            >
              <span className="photo-export-modal__preset-swatches" aria-hidden>
                {colours.map(([r, g, b], index) => (
                  <span
                    key={index}
                    style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                  />
                ))}
              </span>
              {t(`photos.colours.${key}`)}
            </Button>
          )
        })}
      </div>
      <div className="photo-export-modal__colour-inputs">
        <span className="photo-export-modal__label">{t("photos.custom")}</span>
        {colourMap.map(([r, g, b], index) => (
          <input
            type="color"
            className="photo-export-modal__colour-input"
            aria-label={t("photos.shade", { number: index + 1 })}
            onChange={({ target }) => {
              const hex = target.value.replace("#", "")
              setColourMap((current) => {
                const copy = [...current] satisfies ColourMap
                copy[index] = [
                  parseInt(hex.substring(0, 2), 16),
                  parseInt(hex.substring(2, 4), 16),
                  parseInt(hex.substring(4, 6), 16),
                ]
                return copy
              })
            }}
            value={`#${toHex(r)}${toHex(g)}${toHex(b)}`}
            key={index}
          ></input>
        ))}
      </div>
    </div>
  )
}

const Photo = ({
  index,
  path,
  demo,
}: {
  index: number
  path: string
  demo: boolean
}) => {
  const imageSrc = useAtomValue(
    demo
      ? DemoPhotoSelectorFamily(index)
      : PhotoExportImageSelectorFamily({ path, index })
  )
  return (
    <img
      width="128"
      height="112"
      className="photo-export-modal__canvas"
      src={imageSrc}
      alt=""
    />
  )
}

/**
 * A made-up camera photo in the chosen colours: a gradient sky, a sun and
 * hills, different for each index. For the demo only.
 */
const DemoPhotoSelectorFamily = atomFamily((index: number) =>
  atom(async (get) => {
    const colourMap = get(PhotoColourMapAtom)
    const canvas = document.createElement("canvas")
    canvas.width = 128
    canvas.height = 112
    const context = canvas.getContext("2d")
    if (!context) return ""
    const image = context.createImageData(128, 112)
    const sunX = 20 + ((index * 37) % 88)
    const sunY = 18 + ((index * 13) % 30)

    for (let y = 0; y < 112; y++) {
      for (let x = 0; x < 128; x++) {
        const hill = 70 + Math.sin((x + index * 9) / 14) * 10
        const sun = (x - sunX) ** 2 + (y - sunY) ** 2 < 100
        const dither = (x + y) % 2 === 0 ? 0.5 : 0
        let shade = Math.min(2, Math.floor((y / 112) * 3 + dither))
        if (sun) shade = 0
        if (y > hill) shade = 3
        const [r, g, b] = colourMap[shade]
        const offset = (y * 128 + x) * 4
        image.data[offset] = r
        image.data[offset + 1] = g
        image.data[offset + 2] = b
        image.data[offset + 3] = 255
      }
    }
    context.putImageData(image, 0, 0)
    return canvas.toDataURL()
  })
)

const toHex = (colour: number) => colour.toString(16).padStart(2, "0")

/** Opens right away with a loader while its data loads. */
export const PhotoExportModal = (props: PhotoExportModalProps) => {
  const { t } = useTranslation("save_states")
  return (
    <ModalSuspense
      className="photo-export-modal"
      title={t("photos.title")}
      onClose={props.onClose}
    >
      <PhotoExportModalContent {...props} />
    </ModalSuspense>
  )
}
