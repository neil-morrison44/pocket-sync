import { Suspense, useMemo, useState } from "react"
import { useRecoilState, useRecoilValue } from "recoil"
import { useSaveScroll } from "../../hooks/useSaveScroll"
import { platformsListSelector } from "../../recoil/platforms/selectors"
import { Controls } from "../controls"
import { Grid } from "../grid"
import { Loader } from "../loader"
import { SearchContextProvider } from "../search/context"
import { PlatformInfo } from "./info"
import { PlatformItem } from "./item"

import "./index.css"
import { selectedSubviewSelector } from "../../recoil/view/selectors"
import { ImagePacks } from "./imagePacks"

export const Platforms = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const platformIds = useRecoilValue(platformsListSelector)
  const { pushScroll, popScroll } = useSaveScroll()

  const [selectedPlatform, setSelectedPlatform] = useRecoilState(
    selectedSubviewSelector
  )

  const sortedPlatformIds = useMemo(
    () => [...platformIds].sort((a, b) => a.localeCompare(b)),
    [platformIds]
  )

  const [imagePacksOpen, setImagePacksOpen] = useState(false)

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
          {
            type: "button",
            text: "Image Packs",
            onClick: () => setImagePacksOpen(true),
          },
        ]}
      />

      {imagePacksOpen && (
        <ImagePacks onClose={() => setImagePacksOpen(false)} />
      )}

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
