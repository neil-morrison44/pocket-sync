import { Suspense, useCallback, useMemo, useState } from "react"
import { useRecoilState, useRecoilValue } from "recoil"
import { useSaveScroll } from "../../hooks/useSaveScroll"
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
  const { pushScroll, popScroll } = useSaveScroll()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [onlyUpdates, setOnlyUpdates] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const { t } = useTranslation("cores")
  const [updateAllOpen, setUpdateAllOpen] = useState(false)

  const closeUpdateAllCallback = useCallback(
    () => setUpdateAllOpen(false),
    [setUpdateAllOpen]
  )

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

          <Suspense
            fallback={
              <label className="controls__item controls__select">
                {t("controls.category")}
              </label>
            }
          >
            <CategoryFilter
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
            />
          </Suspense>
        </ControlsGroup>
      </Controls>

      {updateAllOpen ? (
        <UpdateAll onClose={closeUpdateAllCallback} />
      ) : (
        <SearchContextProvider
          query={searchQuery}
          other={{ onlyUpdates, category: filterCategory }}
        >
          <Suspense fallback={<Loader />}>
            <CoreList
              onSelect={(core) => {
                pushScroll()

                setSelectedCore(core)
              }}
            />
          </Suspense>
        </SearchContextProvider>
      )}

      <Tip>{t("install_tip")}</Tip>
    </div>
  )
}

const CoreList = ({ onSelect }: { onSelect: (coreid: string) => void }) => {
  const { t } = useTranslation("cores")
  const coresList = useRecoilValue(coresListSelector)
  const coreInventory = useRecoilValue(coreInventoryAtom)

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

  return (
    <>
      <h2>{t("installed", { count: sortedList.length })}</h2>
      <Grid>
        {sortedList.map((core) => (
          <Suspense fallback={<Loader title={core} height={160} />} key={core}>
            <CoreItem coreName={core} onClick={() => onSelect(core)} />
          </Suspense>
        ))}
      </Grid>

      <h2>{t("not_installed", { count: notInstalledCores.length })}</h2>
      <Grid>
        {notInstalledCores.map((item) => (
          <Suspense fallback={<Loader />} key={item.identifier}>
            <NotInstalledCoreItem
              inventoryItem={item}
              onClick={() => onSelect(item.identifier)}
            />
          </Suspense>
        ))}
      </Grid>
    </>
  )
}

const CategoryFilter = ({
  filterCategory,
  setFilterCategory,
}: {
  filterCategory: string
  setFilterCategory: (fc: string) => void
}) => {
  const categoryList = useRecoilValue(cateogryListselector)

  const { t } = useTranslation("cores")
  return (
    <ControlsSelect
      options={categoryList}
      selected={filterCategory}
      onChange={setFilterCategory}
    >
      {t("controls.category")}
    </ControlsSelect>
  )
}
