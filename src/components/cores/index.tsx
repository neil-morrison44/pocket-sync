import {
  startTransition,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react"
import { useSaveScroll } from "../../hooks/useSaveScroll"
import { coreInventoryAtom } from "../../jotai/inventory/atoms"
import { cateogryListselector } from "../../jotai/inventory/selectors"
import { coresListSelector } from "../../jotai/selectors"
import { selectedSubviewSelector } from "../../jotai/view/selectors"
import { Controls } from "../controls"
import { Grid } from "../grid"
import { Loader } from "../loader"
import { SearchContextProvider } from "../search/context"
import { CoreInfo } from "./info"
import { CoreItem, NotInstalledCoreItem } from "./item"
import { useTranslation } from "react-i18next"
import { ControlsCheckbox } from "../controls/inputs/checkbox"
import { ControlsGroup } from "../controls/inputs/group"
import { ControlsSelect } from "../controls/inputs/select"
import { ControlsSearch } from "../controls/inputs/search"
import { InventoryItem, SortMode } from "../../types"
import {
  categoryFilterOptionAtom,
  featureFilterOptionAtom,
  platformFilterOptionAtom,
  sortingOptionAtom,
} from "../../jotai/cores/atoms"
import MultiSelect from "../ui/MultiSelect"
import Callout from "../ui/Callout"
import Select from "../ui/Select"
import Button from "../ui/Button"
import { installedCoresWithUpdatesSelector } from "../../jotai/cores/selectors"
import { useInstallAndUpdateCores } from "../update/useInstallAndUpdateCores"
import { UpdateModal } from "../update/modal"
import { corePlatformListSelector } from "../../jotai/inventory/selectors"
import { CORE_FEATURES, CoreFeature } from "./features"
import { useAtom, useAtomValue } from "jotai"
import { useSmoothedAtomValue } from "../../utils/jotai"
import { CardSkeleton } from "../ui/Skeleton"
import NoResults from "../ui/NoResults"

export const Cores = () => {
  const [selectedCore, setSelectedCore] = useAtom(selectedSubviewSelector)
  const { pushScroll, popScroll } = useSaveScroll()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [onlyUpdates, setOnlyUpdates] = useState(false)
  const [filterCategory, setFilterCategory] = useAtom(categoryFilterOptionAtom)
  const [filterFeatures, setFilterFeatures] = useAtom(featureFilterOptionAtom)
  const [filterPlatform, setFilterPlatform] = useAtom(platformFilterOptionAtom)
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

        <SortModeOption sortMode={sortMode} setSortMode={setSortMode} />

        <ControlsGroup title={t("controls.filters_group")}>
          <ControlsCheckbox checked={onlyUpdates} onChange={setOnlyUpdates}>
            {t("controls.updatable")}
          </ControlsCheckbox>

          <Suspense
            fallback={
              <span className="select select--theme-control">
                {t("controls.category")}
              </span>
            }
          >
            <CategoryFilter
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
            />
          </Suspense>

          <Suspense
            fallback={
              <span className="select select--theme-control">
                {t("controls.platform")}
              </span>
            }
          >
            <PlatformFilter
              filterPlatform={filterPlatform}
              setFilterPlatform={setFilterPlatform}
            />
          </Suspense>

          <FeatureFilter
            filterFeatures={filterFeatures}
            setFilterFeatures={setFilterFeatures}
          />
        </ControlsGroup>
      </Controls>

      <Callout className="callout--in-page" dismissId="cores-zip-install">
        {t("install_tip")}
      </Callout>

      <SearchContextProvider
        query={searchQuery}
        other={{
          onlyUpdates,
          category: filterCategory,
          features: filterFeatures,
          platform: filterPlatform,
        }}
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
    <div className="search-results">
      <Suspense>
        <UpdatesSection onSelect={onSelect} />
      </Suspense>

      <div className="cores__section-header">
        <h2>{t("installed", { count: sortedList.length })}</h2>
      </div>
      <Grid placeholderItemHeight={160}>
        {sortedList.map((core) => (
          <Suspense
            fallback={<CardSkeleton height={160} key={core} />}
            key={core}
          >
            <CoreItem coreName={core} onClick={() => onSelect(core)} />
          </Suspense>
        ))}
      </Grid>

      <div className="cores__section-header">
        <h2>{t("not_installed", { count: notInstalledCores.length })}</h2>
      </div>
      <Grid placeholderItemHeight={160}>
        {notInstalledCores.map((item) => (
          <Suspense
            fallback={<CardSkeleton height={160} key={item.id} />}
            key={item.id}
          >
            <NotInstalledCoreItem
              inventoryItem={item}
              onClick={() => onSelect(item.id)}
            />
          </Suspense>
        ))}
      </Grid>
      {sortedList.length + notInstalledCores.length > 0 && <NoResults />}
    </div>
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
      searchPlaceholder={t("controls.search")}
      selected={filterCategory}
      onChange={setFilterCategory}
    >
      {t("controls.category")}
    </ControlsSelect>
  )
}

/**
 * Installed cores with an update, on top of the list, with Update All. Uses
 * the same bulk updater and progress modal as the Update page.
 */
const UpdatesSection = ({ onSelect }: { onSelect: (core: string) => void }) => {
  const updates = useAtomValue(installedCoresWithUpdatesSelector)
  const { start, running, finish } = useInstallAndUpdateCores()
  const { t } = useTranslation("cores")

  if (updates.length === 0 && !running) return null

  return (
    <section className="cores__updates">
      <div className="cores__section-header">
        <h2>{t("updates", { count: updates.length })}</h2>
        {updates.length > 0 && (
          <Button
            theme="primary"
            icon="upload"
            onClick={() =>
              start({ updateList: updates.map(({ coreName }) => coreName) })
            }
          >
            {t("controls.update_all_count", { count: updates.length })}
          </Button>
        )}
      </div>
      <Grid placeholderItemHeight={160}>
        {updates.map(({ coreName }) => (
          <Suspense
            fallback={<CardSkeleton height={160} key={coreName} />}
            key={coreName}
          >
            <CoreItem coreName={coreName} onClick={() => onSelect(coreName)} />
          </Suspense>
        ))}
      </Grid>
      {running && <UpdateModal onClose={finish} />}
    </section>
  )
}

/** Only shows cores for one platform; grouped by manufacturer, searchable. */
const PlatformFilter = ({
  filterPlatform,
  setFilterPlatform,
}: {
  filterPlatform: string
  setFilterPlatform: (platform: string) => void
}) => {
  const platforms = useAtomValue(corePlatformListSelector)
  const { t } = useTranslation("cores")
  const { t: tPlatforms } = useTranslation("platforms")

  return (
    <Select
      label={t("controls.platform")}
      searchable
      searchPlaceholder={t("controls.search")}
      value={filterPlatform}
      onChange={(value) => startTransition(() => setFilterPlatform(value))}
      options={[
        { value: "All", label: tPlatforms("archive.filters.all") },
        ...platforms.map(({ id, name, manufacturer }) => ({
          value: id,
          label: name,
          group: manufacturer,
        })),
      ]}
    />
  )
}

/** Only shows cores that support every checked feature. */
const FeatureFilter = ({
  filterFeatures,
  setFilterFeatures,
}: {
  filterFeatures: CoreFeature[]
  setFilterFeatures: (features: CoreFeature[]) => void
}) => {
  const { t } = useTranslation("cores")
  const { t: tInfo } = useTranslation("core_info")
  const { t: tUpdate } = useTranslation("update")

  return (
    <MultiSelect
      options={CORE_FEATURES.map((feature) => ({
        value: feature,
        label: tInfo(`supports_items.${feature}`),
      }))}
      value={filterFeatures}
      onChange={(features) =>
        startTransition(() => setFilterFeatures(features))
      }
      selectAllLabel={tUpdate("controls.select_all")}
      clearAllLabel={tUpdate("controls.clear_all")}
    >
      {filterFeatures.length > 0
        ? t("controls.features_count", { count: filterFeatures.length })
        : t("controls.features")}
    </MultiSelect>
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
