import React, { Suspense } from "react"
import { useRecoilValue } from "recoil"
import { screenshotDataAtom } from "../../recoil/atoms"
import { screenshotsListSelector } from "../../recoil/selectors"
import { Screenshot } from "./item"

import "./index.css"
import { Loader } from "../loader"

export const Screenshots = () => {
  const screenshots = useRecoilValue(screenshotsListSelector)

  return (
    <div className="screenshots">
      {screenshots.map((fileName) => (
        <Suspense fallback={<Loader className="screenshots__loading-item" />}>
          <Screenshot fileName={fileName} key={fileName} />
        </Suspense>
      ))}
    </div>
  )
}
