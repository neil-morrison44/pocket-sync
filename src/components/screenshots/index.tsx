import React, { Suspense, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { screenshotsListSelector } from "../../recoil/selectors"
import { Screenshot } from "./item"

import "./index.css"
import { Loader } from "../loader"
import { ScreenshotInfo } from "./info"
import { Grid } from "../grid"

export const Screenshots = () => {
  const [selected, setSelected] = useState<string | null>(null)
  const screenshots = useRecoilValue(screenshotsListSelector)

  const sortedScreenshots = useMemo(() => {
    return [...screenshots].sort((a, b) => b.localeCompare(a))
  }, [screenshots])

  if (selected) {
    return (
      <ScreenshotInfo fileName={selected} onBack={() => setSelected(null)} />
    )
  }

  return (
    <Grid className="screenshots">
      {sortedScreenshots.map((fileName) => (
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
    </Grid>
  )
}
