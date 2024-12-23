import { Suspense, useMemo, useState } from "react"
import {
  useRecoilCallback,
  useRecoilState_TRANSITION_SUPPORT_UNSTABLE,
  useRecoilValue_TRANSITION_SUPPORT_UNSTABLE,
} from "recoil"
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
import "../cores/index.css"
import { selectedSubviewSelector } from "../../recoil/view/selectors"
import { ImagePacks } from "./imagePacks"
import { useTranslation } from "react-i18next"
import { confirm } from "@tauri-apps/plugin-dialog"
import { invokeDeleteFiles } from "../../utils/invokes"
import { DataPacks } from "./dataPacks"
import { ControlsSearch } from "../controls/inputs/search"
import { ControlsButton } from "../controls/inputs/button"

export const Platforms = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const platformIds = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    platformsListSelector
  )
  const { pushScroll, popScroll } = useSaveScroll()
  const { t } = useTranslation("platforms")

  const [selectedPlatform, setSelectedPlatform] =
    useRecoilState_TRANSITION_SUPPORT_UNSTABLE(selectedSubviewSelector)

  const sortedPlatformIds = useMemo(
    () => [...platformIds].sort((a, b) => a.localeCompare(b)),
    [platformIds]
  )

  const [imagePacksOpen, setImagePacksOpen] = useState(false)
  const [dataPacksOpen, setDataPacksOpen] = useState(false)

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
      <Controls>
        <ControlsSearch
          placeholder={t("controls.search")}
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <ControlsButton onClick={removeCorelessPlatforms}>
          {t("controls.remove_coreless")}
        </ControlsButton>
        <ControlsButton onClick={() => setDataPacksOpen(true)}>
          {t("controls.data_packs")}
        </ControlsButton>
        <ControlsButton onClick={() => setImagePacksOpen(true)}>
          {t("controls.image_packs")}
        </ControlsButton>
      </Controls>

      {imagePacksOpen && (
        <ImagePacks onClose={() => setImagePacksOpen(false)} />
      )}
      {dataPacksOpen && <DataPacks onClose={() => setDataPacksOpen(false)} />}

      <SearchContextProvider query={searchQuery}>
        <Grid placeholderItemHeight={200}>
          {sortedPlatformIds.map((id) => (
            <Suspense fallback={<Loader title={id} height={200} />} key={id}>
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
