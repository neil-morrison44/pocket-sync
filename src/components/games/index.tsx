import { Suspense, useMemo, useState } from "react"
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
import { useAtomValue } from "jotai"
import { CoreConditional } from "../shared/coreConditional"
import { MROMModal } from "./mrom"

export const Games = () => {
  const coresList = useAtomValue(coresListSelector)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const [cleanFilesOpen, setCleanFilesOpen] = useState(false)
  const [instanceJsonOpen, setInstanceJsonOpen] = useState(false)
  const [mromOpen, setMROMOpen] = useState(false)
  const { t } = useTranslation("games")

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

  const categoryList = useAtomValue(cateogryListselector)

  return (
    <div>
      {cleanFilesOpen && (
        <CleanFilesModal onClose={() => setCleanFilesOpen(false)} />
      )}
      {instanceJsonOpen && (
        <InstanceJson onClose={() => setInstanceJsonOpen(false)} />
      )}
      {mromOpen && <MROMModal onClose={() => setMROMOpen(false)} />}
      <Controls>
        <ControlsSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("controls.search")}
        />
        <CoreConditional core="NRL.MROM">
          <ControlsButton onClick={() => setMROMOpen(true)}>
            {t("controls.mrom")}
          </ControlsButton>
        </CoreConditional>
        <ControlsButton onClick={() => setCleanFilesOpen(true)}>
          {t("controls.clean_files")}
        </ControlsButton>
        <ControlsButton onClick={() => setInstanceJsonOpen(true)}>
          {t("controls.instance_json")}
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
            <Suspense key={core} fallback={<Loader key={core} height={130} />}>
              <CoreFolderItem coreName={core} />
            </Suspense>
          ))}
        </Grid>
      </SearchContextProvider>
    </div>
  )
}
