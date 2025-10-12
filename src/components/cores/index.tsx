import {
  startTransition,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react"
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
import { InventoryItem, SortMode } from "../../types"
import {
  categoryFilterOptionAtom,
  sortingOptionAtom,
} from "../../recoil/cores/atoms"
import { useAtom, useAtomValue } from "jotai"
import { useSmoothedAtomValue } from "../../utils/jotai"

export const Cores = () => {
  const [selectedCore, setSelectedCore] = useAtom(selectedSubviewSelector)
  const { pushScroll, popScroll } = useSaveScroll()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [onlyUpdates, setOnlyUpdates] = useState(false)
  const [filterCategory, setFilterCategory] = useAtom(categoryFilterOptionAtom)
  const { t } = useTranslation("cores")
  const [updateAllOpen, setUpdateAllOpen] = useState(false)
  const [sortMode, setSortMode] = useAtom(sortingOptionAtom)

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

        <SortModeOption sortMode={sortMode} setSortMode={setSortMode} />

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
        <Suspense>
          <UpdateAll onClose={closeUpdateAllCallback} />
        </Suspense>
      ) : (
        <SearchContextProvider
          query={searchQuery}
          other={{ onlyUpdates, category: filterCategory }}
        >
          <Suspense fallback={<Loader />}>
            <CoreList
              sortMode={sortMode}
              onSelect={(core) => {
                pushScroll()
                startTransition(() => setSelectedCore(core))
              }}
            />
          </Suspense>
        </SearchContextProvider>
      )}

      <Tip>{t("install_tip")}</Tip>
    </div>
  )
}

const CoreList = ({
  onSelect,
  sortMode,
}: {
  sortMode: SortMode
  onSelect: (coreid: string) => void
}) => {
  const { t } = useTranslation("cores")
  const coresList = useAtomValue(coresListSelector)
  const coreInventory = useSmoothedAtomValue(coreInventoryAtom)

  const notInstalledCores = useMemo(
    () =>
      coreInventory.cores.data
        .filter(({ id }) => !coresList.includes(id))
        .sort((a, b) => {
          const dateA = new Date(a.releases[0].core.metadata.date_release)
          const dateB = new Date(b.releases[0].core.metadata.date_release)
          switch (sortMode) {
            case "last_update":
              return dateB.getTime() - dateA.getTime()
            case "name":
            default:
              return a.id.localeCompare(b.id)
          }
        }),
    [coreInventory.cores.data, coresList, sortMode]
  )

  const sortedList = useMemo(() => {
    switch (sortMode) {
      case "last_update":
        return [...coresList].sort((a, b) => {
          const inventoryItemA = coreInventory.cores.data.find(
            ({ id }) => id === a
          )
          const inventoryItemB = coreInventory.cores.data.find(
            ({ id }) => id === b
          )

          if (!inventoryItemA || !inventoryItemB) {
            if (!inventoryItemA && !inventoryItemB) return 0
            if (inventoryItemA && !inventoryItemB) return -1
            if (!inventoryItemA && inventoryItemB) return 1
          }

          const dateA = new Date(
            (
              inventoryItemA as InventoryItem
            ).releases[0].core.metadata.date_release
          )
          const dateB = new Date(
            (
              inventoryItemB as InventoryItem
            ).releases[0].core.metadata.date_release
          )

          return dateB.getTime() - dateA.getTime()
        })

      case "name":
      default:
        return [...coresList].sort((a, b) => {
          const [authorA, coreA] = a.split(".")
          const switchedA = `${coreA}.${authorA}`

          const [authorB, coreB] = b.split(".")
          const switchedB = `${coreB}.${authorB}`

          return switchedA.localeCompare(switchedB)
        })
    }
  }, [coreInventory.cores.data, coresList, sortMode])

  return (
    <>
      <h2>{t("installed", { count: sortedList.length })}</h2>
      <Grid placeholderItemHeight={160}>
        {sortedList.map((core) => (
          <Suspense
            fallback={<Loader title={core} height={160} key={core} />}
            key={core}
          >
            <CoreItem coreName={core} onClick={() => onSelect(core)} />
          </Suspense>
        ))}
      </Grid>

      <h2>{t("not_installed", { count: notInstalledCores.length })}</h2>
      <Grid placeholderItemHeight={160}>
        {notInstalledCores.map((item) => (
          <Suspense
            fallback={<Loader title={item.id} height={160} key={item.id} />}
            key={item.id}
          >
            <NotInstalledCoreItem
              inventoryItem={item}
              onClick={() => onSelect(item.id)}
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
  const categoryList = useAtomValue(cateogryListselector)

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

const SortModeOption = ({
  sortMode,
  setSortMode,
}: {
  sortMode: SortMode
  setSortMode: (sm: SortMode) => void
}) => {
  const { t } = useTranslation("cores")
  return (
    <ControlsSelect
      options={["name", "last_update"]}
      selected={sortMode}
      onChange={setSortMode}
      i18nPrefix="cores:controls.sort_options"
    >
      {t("controls.sort")}
    </ControlsSelect>
  )
}
