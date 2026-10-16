import { useMemo } from "react"
import {
  SaveStateImageSelectorFamily,
  SaveStateMetadataSelectorFamily,
} from "../../jotai/saveStates/selectors"

import { parse } from "date-fns"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"
import IconButton from "../ui/IconButton"
import Tile from "../ui/Tile"

type SaveStateItemProps = {
  path: string
  selected: boolean
  onClick: () => void
  onExportPhotos: () => void
}

const GB_CAMERA_NAMES = [
  "Game Boy Camera",
  "Pocket Camera",
  "Game Boy Camera Gold",
]

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
      otherFn={({ platform, game }) =>
        (!platform || platform === "All" || metadata.platform === platform) &&
        (!game || game === "All" || metadata.game === game)
      }
    >
      <Tile
        className="save-states__item"
        orientation="horizontal"
        onClick={onClick}
        selected={selected}
        media={<img className="save-states__image" src={imageSrc} alt="" />}
        title={gameName}
        meta={
          date && (
            <>
              <span>{t("item.date", { date })}</span>
              <span>{t("item.time", { date })}</span>
            </>
          )
        }
        actions={
          GB_CAMERA_NAMES.includes(metadata.game) && (
            <IconButton
              theme="tertiary"
              icon="camera"
              label={t("photos.open_export")}
              onClick={onExportPhotos}
            />
          )
        }
      />
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
