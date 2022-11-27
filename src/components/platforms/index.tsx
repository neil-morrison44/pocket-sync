import { Suspense, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { useSaveScroll } from "../../hooks/useSaveScroll"
import { platformsListSelector } from "../../recoil/platforms/selectors"
import { PlatformId } from "../../types"
import { Controls } from "../controls"
import { Grid } from "../grid"
import { Loader } from "../loader"
import { SearchContextProvider } from "../search/context"
import { PlatformInfo } from "./info"
import { PlatformItem } from "./item"

import "./index.css"

export const Platforms = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const platformIds = useRecoilValue(platformsListSelector)
  const { pushScroll, popScroll } = useSaveScroll()

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | null>(
    null
  )

  const sortedPlatformIds = useMemo(
    () => [...platformIds].sort((a, b) => a.localeCompare(b)),
    [platformIds]
  )

  if (selectedPlatform)
    return (
      <PlatformInfo
        id={selectedPlatform}
        onBack={() => {
          setSelectedPlatform(null)
          popScroll()
        }}
      />
    )

  return (
    <div>
      <Controls
        controls={[
          {
            type: "search",
            text: "Search",
            value: searchQuery,
            onChange: (v) => setSearchQuery(v),
          },
        ]}
      />
      <SearchContextProvider query={searchQuery}>
        <Grid>
          {sortedPlatformIds.map((id) => (
            <Suspense fallback={<Loader title={id} />} key={id}>
              <PlatformItem
                id={id}
                onClick={() => {
                  setSelectedPlatform(id)
                  pushScroll()
                }}
              />
            </Suspense>
          ))}
        </Grid>
      </SearchContextProvider>
    </div>
  )
}
