import React, { ReactElement, useCallback, useMemo } from "react"
import { useRecoilValue } from "recoil"
import { SingleScreenshotSelectorFamily } from "../../recoil/screenshots/selectors"
import { SearchContextSelfHidingConsumer } from "../search/context"

type ScreenshotProps = {
  fileName: string
  onClick: () => void
}

export const Screenshot = ({
  fileName,
  onClick,
}: ScreenshotProps): ReactElement => {
  const screenshot = useRecoilValue(SingleScreenshotSelectorFamily(fileName))
  if (screenshot === null) throw new Error(`Null file ${fileName}`)

  const blob = useMemo(() => URL.createObjectURL(screenshot.file), [screenshot])

  return (
    <SearchContextSelfHidingConsumer
      fields={[screenshot.game, screenshot.platform]}
    >
      <div className="screenshots__item" role="button" onClick={onClick}>
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
