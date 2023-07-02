import React, { useMemo } from "react"
import {
  SaveStateImageSelectorFamily,
  SaveStateMetadataSelectorFamily,
} from "../../recoil/saveStates/selectors"
import { useRecoilValue } from "recoil"
import { parse } from "date-fns"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { useTranslation } from "react-i18next"

type SaveStateItemProps = {
  path: string
  selected: boolean
  onClick: () => void
}

export const SaveStateItem = ({
  path,
  selected,
  onClick,
}: SaveStateItemProps) => {
  const metadata = useRecoilValue(SaveStateMetadataSelectorFamily(path))
  const imageSrc = useRecoilValue(SaveStateImageSelectorFamily(path))
  const date = useSaveStateDate(path)
  const { t } = useTranslation("save_states")

  const gameName = useMemo(() => {
    const { game } = metadata
    if (!game.includes(".")) return game
    const filetypeIndex = game.lastIndexOf(".")
    return game.substring(0, filetypeIndex)
  }, [metadata.game])

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
