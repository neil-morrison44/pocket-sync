import { ReactElement, useMemo } from "react"

import { SingleScreenshotSelectorFamily } from "../../recoil/screenshots/selectors"
import { SearchContextSelfHidingConsumer } from "../search/context"
import { useAtomValue } from "jotai"

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

  const blob = useMemo(() => URL.createObjectURL(screenshot.file), [screenshot])

  return (
    <SearchContextSelfHidingConsumer
      fields={[screenshot.game, screenshot.platform]}
    >
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
          <div className="screenshots__item-info-line">
            {screenshot.platform}
          </div>
        </div>
      </div>
    </SearchContextSelfHidingConsumer>
  )
}
