import {
  startTransition,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react"
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
import { ViewTransition } from "react"
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
import { useAtom, useAtomValue } from "jotai"
import { useAtomCallback } from "jotai/utils"

export const Platforms = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const platformIds = useAtomValue(platformsListSelector)
  const { pushScroll, popScroll } = useSaveScroll()
  const { t } = useTranslation("platforms")

  const [selectedPlatform, setSelectedPlatform] = useAtom(
    selectedSubviewSelector
  )

  const sortedPlatformIds = useMemo(
    () => [...platformIds].sort((a, b) => a.localeCompare(b)),
    [platformIds]
  )

  const [imagePacksOpen, setImagePacksOpen] = useState(false)
  const [dataPacksOpen, setDataPacksOpen] = useState(false)

  const removeCorelessPlatforms = useAtomCallback(
    useCallback(async (get, set) => {
      const platformsWithoutCores = await get(platformsWithoutCoresSelector)

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
    }, [])
  )

  if (selectedPlatform)
    return (
      <Suspense>
        <PlatformInfo
          id={selectedPlatform}
          onBack={() => {
            startTransition(() => {
              setSelectedPlatform(null)
              popScroll()
            })
          }}
        />
      </Suspense>
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
                  startTransition(() => {
                    setSelectedPlatform(id)
                    pushScroll()
                  })
                }}
              />
            </Suspense>
          ))}
        </Grid>
      </SearchContextProvider>
    </div>
  )
}
