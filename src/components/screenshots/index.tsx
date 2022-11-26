import React, { Suspense, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { screenshotsListSelector } from "../../recoil/screenshots/selectors"
import { Screenshot } from "./item"

import "./index.css"
import { Loader } from "../loader"
import { ScreenshotInfo } from "./info"
import { Grid } from "../grid"
import { useSaveScroll } from "../../hooks/useSaveScroll"
import { Controls } from "../controls"
import { SearchContextProvider } from "../search/context"

export const Screenshots = () => {
  const [selected, setSelected] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const screenshots = useRecoilValue(screenshotsListSelector)

  const { pushScroll, popScroll } = useSaveScroll()

  const sortedScreenshots = useMemo(() => {
    return [...screenshots].sort((a, b) => b.localeCompare(a))
  }, [screenshots])

  if (selected) {
    return (
      <ScreenshotInfo
        fileName={selected}
        onBack={() => {
          setSelected(null)
          popScroll()
        }}
      />
    )
  }

  if (sortedScreenshots.length === 0) {
    return (
      <div className="screenshots screenshots--none">
        <p>Once you take some screenshots they'll appear here</p>
      </div>
    )
  }

  return (
    <>
      <Controls
        controls={[
          {
            type: "search",
            text: "Search",
            value: searchQuery,
            onChange: (v) => {
              setSearchQuery(v)
            },
          },
        ]}
      />
      <SearchContextProvider query={searchQuery}>
        <Grid className="screenshots">
          {sortedScreenshots.map((fileName) => (
            <Suspense
              fallback={<Loader className="screenshots__loading-item" />}
              key={fileName}
            >
              <Screenshot
                fileName={fileName}
                onClick={() => {
                  pushScroll()
                  setSelected(fileName)
                }}
              />
            </Suspense>
          ))}
        </Grid>
      </SearchContextProvider>
    </>
  )
}
