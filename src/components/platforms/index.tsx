import { Suspense, useMemo, useState } from "react"
import { useRecoilCallback, useRecoilState, useRecoilValue } from "recoil"
import { useSaveScroll } from "../../hooks/useSaveScroll"
import {
  platformsListSelector,
  platformsWithoutCoresSelector,
} from "../../recoil/platforms/selectors"
import { Controls } from "../controls"
import { Grid } from "../grid"
import { Loader } from "../loader"
import { SearchContextProvider } from "../search/context"
import { PlatformInfo } from "./info"
import { PlatformItem } from "./item"

import "./index.css"
import { selectedSubviewSelector } from "../../recoil/view/selectors"
import { ImagePacks } from "./imagePacks"
import { useTranslation } from "react-i18next"
import { confirm } from "@tauri-apps/api/dialog"
import { invokeDeleteFiles } from "../../utils/invokes"
import { useInvalidateFileSystem } from "../../hooks/invalidation"
import { DataPacks } from "./dataPacks"

export const Platforms = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const platformIds = useRecoilValue(platformsListSelector)
  const { pushScroll, popScroll } = useSaveScroll()
  const { t } = useTranslation("platforms")

  const [selectedPlatform, setSelectedPlatform] = useRecoilState(
    selectedSubviewSelector
  )

  const sortedPlatformIds = useMemo(
    () => [...platformIds].sort((a, b) => a.localeCompare(b)),
    [platformIds]
  )

  const [imagePacksOpen, setImagePacksOpen] = useState(false)
  const [dataPacksOpen, setDataPacksOpen] = useState(false)

  const invalidateFS = useInvalidateFileSystem()

  const removeCorelessPlatforms = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const platformsWithoutCores = await snapshot.getPromise(
          platformsWithoutCoresSelector
        )

        const confirmation = await confirm(
          t("delete_unused", { count: platformsWithoutCores.length })
        )

        if (confirmation && platformsWithoutCores.length > 0) {
          await invokeDeleteFiles(
            platformsWithoutCores.map(
              (platformId) => `Platforms/${platformId}.json`
            )
          )
          invalidateFS()
        }
      },
    []
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
            text: t("controls.search"),
            value: searchQuery,
            onChange: (v) => setSearchQuery(v),
          },
          {
            type: "button",
            text: "Remove Coreless",
            onClick: removeCorelessPlatforms,
          },
          {
            type: "button",
            text: t("controls.data_packs"),
            onClick: () => setDataPacksOpen(true),
          },
          {
            type: "button",
            text: t("controls.image_packs"),
            onClick: () => setImagePacksOpen(true),
          },
        ]}
      />

      {imagePacksOpen && (
        <ImagePacks onClose={() => setImagePacksOpen(false)} />
      )}
      {dataPacksOpen && <DataPacks onClose={() => setDataPacksOpen(false)} />}

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
