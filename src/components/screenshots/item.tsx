import { ReactElement, useMemo } from "react"

import { SingleScreenshotSelectorFamily } from "../../jotai/screenshots/selectors"
import { useAtomValue } from "jotai"
import { useTranslation } from "react-i18next"

type ScreenshotProps = {
  fileName: string
  selected: boolean
  onClick: () => void
}

export const Screenshot = ({
  fileName,
  selected,
  onClick,
}: ScreenshotProps): ReactElement => {
  const screenshot = useAtomValue(SingleScreenshotSelectorFamily(fileName))
  if (screenshot === null) throw new Error(`Null file ${fileName}`)

  const { t } = useTranslation("screenshots")
  const blob = useMemo(() => URL.createObjectURL(screenshot.file), [screenshot])

  return (
    <div
      className={`screenshots__item screenshots__item--${
        selected ? "selected" : "not-selected"
      }`}
      role="button"
      onClick={onClick}
    >
      <img className="screenshots__item-image" src={blob} />

      <div className="screenshots__item-info">
        <div className="screenshots__item-info-line">{screenshot.game}</div>
        <div className="screenshots__item-info-line">{screenshot.platform}</div>
        {screenshot.timestamp && (
          <div className="screenshots__item-info-line screenshots__item-date">
            {t("taken", { date: screenshot.timestamp })}
          </div>
        )}
      </div>
    </div>
  )
}
