import React, { Suspense, useState } from "react"
import { useRecoilValue } from "recoil"
import { screenshotsListSelector } from "../../recoil/selectors"
import { Screenshot } from "./item"

import "./index.css"
import { Loader } from "../loader"
import { ScreenshotInfo } from "./info"

export const Screenshots = () => {
  const [selected, setSelected] = useState<string | null>(null)
  const screenshots = useRecoilValue(screenshotsListSelector)

  if (selected) {
    return (
      <ScreenshotInfo fileName={selected} onBack={() => setSelected(null)} />
    )
  }

  return (
    <div className="screenshots">
      {screenshots.map((fileName) => (
        <Suspense
          fallback={<Loader className="screenshots__loading-item" />}
          key={fileName}
        >
          <Screenshot
            fileName={fileName}
            onClick={() => setSelected(fileName)}
          />
        </Suspense>
      ))}
    </div>
  )
}
