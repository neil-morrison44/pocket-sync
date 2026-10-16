import {
  ReactNode,
  startTransition,
  Suspense,
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react"
import { useTileCount } from "../../hooks/useTileCount"
import { useSaveScroll } from "../../hooks/useSaveScroll"
import { coreInventoryAtom } from "../../jotai/inventory/atoms"
import { cateogryListselector } from "../../jotai/inventory/selectors"
import { coresListSelector } from "../../jotai/selectors"
import { selectedSubviewSelector } from "../../jotai/view/selectors"
import { Controls } from "../controls"
import { Grid } from "../grid"
import { Loader } from "../loader"
import {
  SearchContextProvider,
  SearchOther,
  useSearchContext,
} from "../search/context"
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
  aiCheckAtom,
  aiFilterOptionAtom,
  licenseFilterOptionAtom,
} from "../../jotai/cores/atoms"
import MultiSelect from "../ui/MultiSelect"
import Callout from "../ui/Callout"
import Select from "../ui/Select"
import Button from "../ui/Button"
import { installedCoresWithUpdatesSelector } from "../../jotai/cores/selectors"
import { useInstallAndUpdateCores } from "../update/useInstallAndUpdateCores"
import { UpdateModal } from "../update/modal"
import { corePlatformListSelector } from "../../jotai/inventory/selectors"
import {
  CORE_FEATURES,
  CoreFeature,
  getCoreFeatures,
  hasFeatures,
  LicenseFilter,
  passesTagFilters,
} from "./features"
import { fuzzy } from "fast-fuzzy"
import { PocketSyncConfigSelector } from "../../jotai/config/selectors"
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
  const [filterLicense, setFilterLicense] = useAtom(licenseFilterOptionAtom)
  const [filterAi, setFilterAi] = useAtom(aiFilterOptionAtom)
  const { t } = useTranslation("cores")
  const [updateAllOpen, setUpdateAllOpen] = useState(false)
  const [sortMode, setSortMode] = useAtom(sortingOptionAtom)

  const closeUpdateAllCallback = useCallback(
    () => setUpdateAllOpen(false),
    [setUpdateAllOpen]
  )

  const filtersSet =
    onlyUpdates ||
    filterCategory !== "All" ||
    filterPlatform !== "All" ||
    filterFeatures.length > 0 ||
    filterLicense !== "all" ||
    filterAi !== null

  // Typing stays quick: the list filters with these a moment later
  const deferredQuery = useDeferredValue(searchQuery)
  const other = useMemo(
    () => ({
      onlyUpdates,
      category: filterCategory,
      features: filterFeatures,
      platform: filterPlatform,
      license: filterLicense,
      maxAi: filterAi,
    }),
    [
      onlyUpdates,
      filterCategory,
      filterFeatures,
      filterPlatform,
      filterLicense,
      filterAi,
    ]
  )
  const deferredOther = useDeferredValue(other)

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

        <ControlsGroup
          onClear={
            filtersSet
              ? () =>
                  startTransition(() => {
                    setOnlyUpdates(false)
                    setFilterCategory("All")
                    setFilterPlatform("All")
                    setFilterFeatures([])
                    setFilterLicense("all")
                    setFilterAi(null)
                  })
              : undefined
          }
        >
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

          <Select
            label={t("controls.license")}
            active={filterLicense !== "all"}
            value={filterLicense}
            onChange={(value) =>
              startTransition(() => setFilterLicense(value as LicenseFilter))
            }
            options={[
              { value: "all", label: t("controls.all") },
              { value: "free", label: t("controls.license_free") },
              { value: "license", label: t("controls.license_required") },
            ]}
          />

          <Select
            label={t("controls.ai")}
            active={filterAi !== null}
            value={filterAi === null ? "any" : String(filterAi)}
            onChange={(value) =>
              startTransition(() =>
                setFilterAi(value === "any" ? null : Number(value))
              )
            }
            options={[
              { value: "any", label: t("controls.all") },
              { value: "0", label: t("controls.ai_none") },
              ...[0.25, 0.5, 0.75].map((max) => ({
                value: String(max),
                label: t("controls.ai_up_to", { max }),
              })),
            ]}
          />
        </ControlsGroup>
      </Controls>

      <Callout className="callout--in-page" dismissId="cores-zip-install">
        {t("install_tip")}
      </Callout>

      <SearchContextProvider query={deferredQuery} other={deferredOther}>
        <Suspense fallback={<Loader />}>
          <CoreList
            sortMode={sortMode}
            filtering={deferredQuery.trim() !== "" || filtersSet}
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
  filtering,
}: {
  sortMode: SortMode
  onSelect: (coreid: string) => void
  /** A search or filter is on: sections show "n / total" and "no matches". */
  filtering: boolean
}) => {
  const { t } = useTranslation("cores")
  const coresList = useAtomValue(coresListSelector)
  const coreInventory = useSmoothedAtomValue(coreInventoryAtom)
  const aiCheck = useAtomValue(aiCheckAtom)
  const config = useAtomValue(PocketSyncConfigSelector)
  const { query, other } = useSearchContext()

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

  // Filtered here from the inventory's data, so only matching tiles render
  // (each tile filtering itself re-rendered all of them on every key)
  const visibleNotInstalled = useMemo(
    () =>
      filterNotInstalledCores(notInstalledCores, {
        query,
        other,
        platforms: coreInventory.platforms.data,
        aiCheck,
        hidden: config.hidden_cores ?? [],
      }),
    [notInstalledCores, query, other, coreInventory, aiCheck, config]
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

      <CoreSection
        title={(count) =>
          filtering
            ? t("installed_filtered", { count, total: sortedList.length })
            : t("installed", { count: sortedList.length })
        }
        filtering={filtering}
      >
        {sortedList.map((core) => (
          <Suspense
            fallback={<CardSkeleton height={160} key={core} />}
            key={core}
          >
            <CoreItem coreName={core} onClick={() => onSelect(core)} />
          </Suspense>
        ))}
      </CoreSection>

      <CoreSection
        title={() =>
          filtering
            ? t("not_installed_filtered", {
                count: visibleNotInstalled.length,
                total: notInstalledCores.length,
              })
            : t("not_installed", { count: notInstalledCores.length })
        }
        filtering={filtering}
        lazy
      >
        {visibleNotInstalled.map((item) => (
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
      </CoreSection>
    </div>
  )
}

/**
 * Installed or available cores: a heading, the grid, and "Nothing matches"
 * when a search or filter hides every core in it. While filtering, the
 * heading counts the cores shown out of all ("Available (3 / 335)"); the
 * grid then renders every tile, so the count is right.
 */
const CoreSection = ({
  title,
  filtering,
  lazy = false,
  children,
}: {
  title: (shown: number) => string
  filtering: boolean
  /**
   * Its items are filtered already, so tiles can load as they scroll into
   * view even while filtering (the count comes from the list).
   */
  lazy?: boolean
  children: ReactNode
}) => {
  const ref = useRef<HTMLElement>(null)
  const shown = useTileCount(ref)
  return (
    <section className="cores__section search-results" ref={ref}>
      <div className="cores__section-header">
        <h2>{title(shown)}</h2>
      </div>
      <Grid placeholderItemHeight={160} eager={filtering && !lazy}>
        {children}
      </Grid>
      {filtering && <NoResults />}
    </section>
  )
}

const SEARCH_THRESHOLD = 0.8

/**
 * Available cores matching the search (identifier, platform, owner, and
 * the platform's name, maker and category, like installed cores) and the
 * filters. Hidden cores are left out.
 */
const filterNotInstalledCores = (
  items: InventoryItem[],
  {
    query,
    other,
    platforms,
    aiCheck,
    hidden,
  }: {
    query: string
    other?: SearchOther
    platforms: {
      id: string
      name: string
      manufacturer: string
      category?: string | null
    }[]
    aiCheck: Record<string, { overall_score?: number } | undefined>
    hidden: string[]
  }
) => {
  const search = query.toLowerCase().trim()
  return items.filter((item) => {
    if (hidden.includes(item.id)) return false
    const { core, updaters } = item.releases[0]
    const platformId = core.metadata.platform_ids[0]
    const platform = platforms.find(({ id }) => id === platformId)

    if (other?.onlyUpdates) return false // not installed: nothing to update
    if (
      other?.platform &&
      other.platform !== "All" &&
      !core.metadata.platform_ids.includes(other.platform)
    )
      return false
    if (
      other?.category &&
      other.category !== "All" &&
      other.category !== platform?.category
    )
      return false
    if (!hasFeatures(getCoreFeatures(item.id, core.framework), other?.features))
      return false
    if (
      !passesTagFilters(
        {
          requiresLicense: Boolean(updaters?.license),
          aiScore: aiCheck[item.id]?.overall_score ?? 0,
        },
        { license: other?.license, maxAi: other?.maxAi }
      )
    )
      return false

    if (!search) return true
    return [
      platformId,
      item.id,
      item.repository?.owner ?? "",
      platform?.name ?? "",
      platform?.manufacturer ?? "",
      platform?.category ?? "",
    ].some(
      (field) => fuzzy(search, field.toLowerCase().trim()) > SEARCH_THRESHOLD
    )
  })
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
      active={filterCategory !== "All"}
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
      active={filterPlatform !== "All"}
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
