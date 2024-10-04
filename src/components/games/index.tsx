import { Suspense, useMemo, useState } from "react"
import { useRecoilCallback, useRecoilValue } from "recoil"
import { fileSystemInvalidationAtom } from "../../recoil/atoms"
import { cateogryListselector } from "../../recoil/inventory/selectors"
import { coresListSelector } from "../../recoil/selectors"
import { Controls } from "../controls"
import { Grid } from "../grid"
import { Loader } from "../loader"
import { SearchContextProvider } from "../search/context"
import { InstanceJson } from "./instanceJson"
import { CleanFilesModal } from "./cleanFiles"
import { CoreFolderItem } from "./item"
import { useTranslation } from "react-i18next"
import { ControlsSearch } from "../controls/inputs/search"
import { ControlsButton } from "../controls/inputs/button"
import { ControlsSelect } from "../controls/inputs/select"

import "../cores/index.css"

export const Games = () => {
  const coresList = useRecoilValue(coresListSelector)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const [cleanFilesOpen, setCleanFilesOpen] = useState(false)
  const [instanceJsonOpen, setInstanceJsonOpen] = useState(false)
  const { t } = useTranslation("games")

  const refresh = useRecoilCallback(({ set }) => () => {
    set(fileSystemInvalidationAtom, Date.now())
  })

  const sortedList = useMemo(
    () =>
      [...coresList].sort((a, b) => {
        const [authorA, coreA] = a.split(".")
        const switchedA = `${coreA}.${authorA}`

        const [authorB, coreB] = b.split(".")
        const switchedB = `${coreB}.${authorB}`

        return switchedA.localeCompare(switchedB)
      }),
    [coresList]
  )

  const categoryList = useRecoilValue(cateogryListselector)

  return (
    <div>
      {cleanFilesOpen && (
        <CleanFilesModal onClose={() => setCleanFilesOpen(false)} />
      )}

      {instanceJsonOpen && (
        <InstanceJson onClose={() => setInstanceJsonOpen(false)} />
      )}

      <Controls>
        <ControlsSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("controls.search")}
        />
        <ControlsButton onClick={() => setCleanFilesOpen(true)}>
          {t("controls.clean_files")}
        </ControlsButton>
        <ControlsButton onClick={() => setInstanceJsonOpen(true)}>
          {t("controls.instance_json")}
        </ControlsButton>
        <ControlsButton onClick={refresh}>
          {t("controls.refresh")}
        </ControlsButton>
        <ControlsSelect
          options={categoryList}
          selected={filterCategory}
          onChange={setFilterCategory}
        >
          {t("controls.category")}
        </ControlsSelect>
      </Controls>
      <SearchContextProvider
        query={searchQuery}
        other={{ category: filterCategory }}
      >
        <Grid>
          {sortedList.map((core) => (
            <Suspense fallback={<Loader height={130} />} key={core}>
              <CoreFolderItem coreName={core} />
            </Suspense>
          ))}
        </Grid>
      </SearchContextProvider>
    </div>
  )
}
