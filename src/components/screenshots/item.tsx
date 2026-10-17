import { ReactElement, useMemo } from "react"

import { SingleScreenshotSelectorFamily } from "../../jotai/screenshots/selectors"
import { useAtomValue } from "jotai"
import { useTranslation } from "react-i18next"
import Tile from "../ui/Tile"
import { gameDisplayName } from "../../utils/gameName"

type ScreenshotProps = {
  fileName: string
  selected: boolean
  onClick: () => void
}

/**
 * A screenshot in the gallery: only the picture in the Pocket's 10:9
 * screen (black bars like on the device); the game, its platform and when
 * it was taken show on top of it on hover.
 */
export const Screenshot = ({
  fileName,
  selected,
  onClick,
}: ScreenshotProps): ReactElement => {
  const screenshot = useAtomValue(SingleScreenshotSelectorFamily(fileName))
  const { t } = useTranslation("screenshots")
  const blob = useMemo(
    () => (screenshot ? URL.createObjectURL(screenshot.file) : ""),
    [screenshot]
  )
  if (screenshot === null) throw new Error(`Null file ${fileName}`)

  return (
    <Tile
      className="screenshots__item"
      orientation="overlay"
      onClick={onClick}
      selected={selected}
      media={<img className="screenshots__image" src={blob} alt="" />}
      title={screenshot.game ? gameDisplayName(screenshot.game) : fileName}
      subtitle={screenshot.platform || undefined}
      meta={screenshot.timestamp && t("taken", { date: screenshot.timestamp })}
    />
  )
}
