import React, { ReactElement, useCallback, useMemo } from "react"
import { useRecoilValue } from "recoil"
import { SingleScreenshotSelectorFamily } from "../../recoil/selectors"

type ScreenshotProps = {
  fileName: string
}

export const Screenshot = ({ fileName }: ScreenshotProps): ReactElement => {
  const screenshot = useRecoilValue(SingleScreenshotSelectorFamily(fileName))
  if (screenshot === null) throw new Error(`Null file ${fileName}`)
  const { file } = screenshot
  const shareCallback = useCallback(() => {
    navigator.share({ files: [file] })
  }, [file])

  const blob = useMemo(() => URL.createObjectURL(file), [file])

  return (
    <div className="screenshots__item">
      <img
        className="screenshots__item-image"
        src={blob}
        onClick={shareCallback}
      />

      <div className="screenshots__item-info">
        <div className="screenshots__item-info-line">{screenshot.game}</div>
        <div className="screenshots__item-info-line">{screenshot.platform}</div>
      </div>
    </div>
  )
}
