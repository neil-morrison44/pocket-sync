import { useMemo } from "react"
import {
  SaveStateImageSelectorFamily,
  SaveStateMetadataSelectorFamily,
} from "../../recoil/saveStates/selectors"

import { parse } from "date-fns"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"

type SaveStateItemProps = {
  path: string
  selected: boolean
  onClick: () => void
  onExportPhotos: () => void
}

const GB_CAMERA_NAMES = ["Game Boy Camera", "Pocket Camera"]

export const SaveStateItem = ({
  path,
  selected,
  onClick,
  onExportPhotos,
}: SaveStateItemProps) => {
  const metadata = useAtomValue(SaveStateMetadataSelectorFamily(path))
  const imageSrc = useAtomValue(SaveStateImageSelectorFamily(path))
  const date = useSaveStateDate(path)
  const { t } = useTranslation("save_states")

  const gameName = useMemo(() => {
    const { game } = metadata
    if (!game.includes(".")) return game
    const filetypeIndex = game.lastIndexOf(".")
    return game.substring(0, filetypeIndex)
  }, [metadata])

  return (
    <SearchContextSelfHidingConsumer
      fields={[metadata.game, metadata.platform]}
    >
      <div
        className={`save-states__item save-states__item--${
          selected ? "selected" : "unselected"
        }`}
        onClick={onClick}
      >
        <img className="save-states__item-image" src={imageSrc}></img>

        <div className="save-states__item-info">
          <div className="save-states__item-name">{gameName}</div>
          {date && (
            <div className="save-states__item--date">
              <div>{t("item.date", { date })}</div>
              <div>{t("item.time", { date })}</div>
            </div>
          )}
        </div>

        {GB_CAMERA_NAMES.includes(metadata.game) && (
          <div
            className="save-states__camera-export-button"
            title={t("photos.title")}
            onClick={(e) => {
              e.stopPropagation()
              onExportPhotos()
            }}
          >
            <CameraIcon />
          </div>
        )}
      </div>
    </SearchContextSelfHidingConsumer>
  )
}

const useSaveStateDate = (path: string) => {
  return useMemo(() => {
    const dateRegex = /\/?(?<year>\d{8})_(?<time>\d{6})_/g
    const match = dateRegex.exec(path)
    if (!match?.groups) return null

    const date = parse(
      `${match.groups.year}-${match.groups.time}`,
      "yyyyMMdd-HHmmSS",
      new Date()
    )
    return date
  }, [path])
}

const CameraIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24"
    viewBox="0 -960 960 960"
    width="24"
  >
    <path
      fill="currentColor"
      d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z"
    />
  </svg>
)
