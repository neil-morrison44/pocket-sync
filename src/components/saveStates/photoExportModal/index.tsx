import { Modal } from "../../modal"
import { PhotoExportImageSelectorFamily } from "../../../recoil/saveStates/selectors"
import { Suspense, useState } from "react"

import "./index.css"
import { ColourMap, PhotoColourMapAtom } from "../../../recoil/saveStates/atoms"
import { useExportPhotos } from "./hooks/exportPhotos"
import { useTranslation } from "react-i18next"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { useResetAtom } from "jotai/utils"

export const PhotoExportModal = ({
  path,
  onClose,
}: {
  path: string
  onClose: () => void
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const exportPhotos = useExportPhotos()
  const { t } = useTranslation("save_states")

  return (
    <Modal className="photo-export-modal">
      <h2>{t("photos.title")}</h2>
      <ColourMapPicker />
      <div className="photo-export-modal__layout">
        <LargePhotoView index={selectedIndex} path={path} />
        <div className="photo-export-modal__image-grid">
          {new Array(30).fill(null).map((_, index) => (
            <Suspense key={index + path}>
              <LargePhotoView
                index={index}
                path={path}
                onClick={() => setSelectedIndex(index)}
              />
            </Suspense>
          ))}
        </div>
      </div>

      <div className="photo-export-modal__export-buttons">
        <button onClick={() => exportPhotos(path, selectedIndex)}>
          {t("photos.export_selected")}
        </button>
        <button onClick={() => exportPhotos(path)}>
          {t("photos.export_all")}
        </button>
      </div>
      <button onClick={onClose}>{t("photos.close")}</button>
    </Modal>
  )
}

const ColourMapPicker = () => {
  const reset = useResetAtom(PhotoColourMapAtom)
  const [colourMap, setColourMap] = useAtom(PhotoColourMapAtom)
  const { t } = useTranslation("save_states")

  return (
    <div className="photo-export-modal__palette-bar">
      <h3>{t("photos.palette")}: </h3>
      <button
        onClick={() => {
          setColourMap([
            [155, 188, 15],
            [139, 172, 15],
            [48, 98, 48],
            [15, 56, 15],
          ])
        }}
      >
        {t("photos.colours.gb")}
      </button>
      <button
        onClick={() => {
          setColourMap([
            [255, 255, 255],
            [255, 192, 0],
            [160, 96, 0],
            [0, 0, 0],
          ])
        }}
      >
        {t("photos.colours.gb_player")}
      </button>
      <button onClick={reset}>{t("photos.colours.black_and_white")}</button>
      <div className="photo-export-modal__colour-inputs">
        <h3>{t("photos.custom")}: </h3>
        {colourMap.map(([r, g, b], index) => (
          <input
            type="color"
            className="photo-export-modal__colour-input"
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

const LargePhotoView = ({
  index,
  path,
  onClick,
}: {
  index: number
  path: string
  onClick?: () => void
}) => {
  const imageSrc = useAtomValue(PhotoExportImageSelectorFamily({ path, index }))
  return (
    <img
      width="128"
      height="112"
      className="photo-export-modal__canvas"
      src={imageSrc}
      onClick={onClick}
    />
  )
}

const toHex = (colour: number) => colour.toString(16).padStart(2, "0")
