import { Suspense, useMemo, useState } from "react"
import { useRecoilCallback, useRecoilState, useRecoilValue } from "recoil"
import { useSaveScroll } from "../../hooks/useSaveScroll"
import { fileSystemInvalidationAtom } from "../../recoil/atoms"
import { coreInventoryAtom } from "../../recoil/inventory/atoms"
import { cateogryListselector } from "../../recoil/inventory/selectors"
import { coresListSelector } from "../../recoil/selectors"
import { selectedSubviewSelector } from "../../recoil/view/selectors"
import { Controls } from "../controls"
import { Grid } from "../grid"
import { Loader } from "../loader"
import { SearchContextProvider } from "../search/context"
import { Tip } from "../tip"
import { CoreInfo } from "./info"
import { CoreItem, NotInstalledCoreItem } from "./item"
import { useTranslation } from "react-i18next"
import { ControlsButton } from "../controls/inputs/button"
import { ControlsCheckbox } from "../controls/inputs/checkbox"
import { ControlsGroup } from "../controls/inputs/group"
import { ControlsSelect } from "../controls/inputs/select"
import { ControlsSearch } from "../controls/inputs/search"
import { UpdateAll } from "./updateAll"

export const Cores = () => {
  const [selectedCore, setSelectedCore] = useRecoilState(
    selectedSubviewSelector
  )
  const coresList = useRecoilValue(coresListSelector)
  const [coreInventory, setCoreInventory] = useRecoilState(coreInventoryAtom)
  const { pushScroll, popScroll } = useSaveScroll()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [onlyUpdates, setOnlyUpdates] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const { t } = useTranslation("cores")
  const [updateAllOpen, setUpdateAllOpen] = useState(false)

  const refresh = useRecoilCallback(({ set }) => () => {
    set(fileSystemInvalidationAtom, Date.now())
    // useResetRecoilState doesn't seem to trigger the atom effect, so do it this way
    setCoreInventory({ data: [] })
  })

  const notInstalledCores = useMemo(
    () =>
      coreInventory.data.filter(
        ({ identifier }) => !coresList.includes(identifier)
      ),
    [coresList, coreInventory]
  )

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

  if (selectedCore) {
    return (
      <CoreInfo
        coreName={selectedCore}
        onBack={() => {
          setSelectedCore(null)
          popScroll()
        }}
      />
    )
  }

  return (
    <div>
      <Controls>
        <ControlsSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("controls.search")}
        />
        <ControlsButton onClick={() => setUpdateAllOpen(true)}>
          {t("controls.update_all")}
        </ControlsButton>
        <ControlsGroup title={t("controls.filters_group")}>
          <ControlsCheckbox checked={onlyUpdates} onChange={setOnlyUpdates}>
            {t("controls.updatable")}
          </ControlsCheckbox>
          <ControlsSelect
            options={categoryList}
            selected={filterCategory}
            onChange={setFilterCategory}
          >
            {t("controls.category")}
          </ControlsSelect>
        </ControlsGroup>
        <ControlsButton onClick={refresh}>
          {t("controls.refresh")}
        </ControlsButton>
      </Controls>

      {updateAllOpen && <UpdateAll onClose={() => setUpdateAllOpen(false)} />}

      <h2>{t("installed", { count: sortedList.length })}</h2>
      <SearchContextProvider
        query={searchQuery}
        other={{ onlyUpdates, category: filterCategory }}
      >
        <Grid>
          {sortedList.map((core) => (
            <Suspense
              fallback={<Loader title={core} height={160} />}
              key={core}
            >
              <CoreItem
                coreName={core}
                onClick={() => {
                  pushScroll()
                  setSelectedCore(core)
                }}
              />
            </Suspense>
          ))}
        </Grid>

        <h2>{t("not_installed", { count: notInstalledCores.length })}</h2>
        <Grid>
          {notInstalledCores.map((item) => (
            <Suspense fallback={<Loader />} key={item.identifier}>
              <NotInstalledCoreItem
                inventoryItem={item}
                onClick={() => {
                  pushScroll()
                  setSelectedCore(item.identifier)
                }}
              />
            </Suspense>
          ))}
        </Grid>
      </SearchContextProvider>

      <Tip>{t("install_tip")}</Tip>
    </div>
  )
}
