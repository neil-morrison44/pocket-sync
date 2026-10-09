import { useAtom, useAtomValue } from "jotai"
import { useTranslation } from "react-i18next"
import {
  CoreInfoSelectorFamily,
  CoreMainPlatformIdSelectorFamily,
  coresListSelector,
} from "../../jotai/selectors"
import {
  inventoryAuthorListAtom,
  inventoryCategoryListAtom,
  inventoryCoreListAtom,
} from "../../jotai/inventory/selectors"
import {
  createContext,
  Ref,
  Suspense,
  use,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  RefObject,
  useEffectEvent,
} from "react"
import { installedCoresWithUpdatesSelector } from "../../jotai/cores/selectors"
import { PlatformImage } from "../cores/platformImage"
import { coreInventoryAtom } from "../../jotai/inventory/atoms"
import { KeyIcon } from "../cores/icons/keyIcon"
import { aiCheckAtom } from "../../jotai/cores/atoms"
import { Controls } from "../controls"
import { ControlsPopoverButton } from "../controls/inputs/popoverButton"
import { MainPlatformForCoreSelectorFamily } from "../../jotai/platforms/selectors"
import "./index.css"
import { PocketSyncConfigSelector } from "../../jotai/config/selectors"
import { confirm } from "@tauri-apps/plugin-dialog"
import { invokeInstallAndUpdateCores } from "../../utils/invokes"
import { OnlyLoadsWhenShown } from "../../utils/onlyLoadsWhenShown"
import { UpdateModal } from "./modal"
import { InstalledCoreImage, NotInstalledCoreImage } from "./shared"
import {
  updateFilterDefaultsAtom,
  UpdateFilterOptions,
} from "../../jotai/update/atom"
import { OtherFilterType, UpdateControls } from "./controls"
import { turboDownloadsAtom } from "../../jotai/settings/atoms"

export const Update = () => {
  const [updateFilterDefaultsOptions, setUpdateFilterDefaultsOptions] = useAtom(
    updateFilterDefaultsAtom
  )
  const authorList = useAtomValue(inventoryAuthorListAtom)
  const [hiddenAuthorList, setHiddenAuthorList] = useState<string[]>(
    updateFilterDefaultsOptions.authorFilters
  )
  const categoryList = useAtomValue(inventoryCategoryListAtom)
  const [hiddenCategoryList, setHiddenCategoryList] = useState<string[]>(
    updateFilterDefaultsOptions.categoryFilters
  )
  const [aiNess, setAiNess] = useState(updateFilterDefaultsOptions.aiNessFilter)
  const [otherFilters, setOtherFilters] = useState<OtherFilterType[]>(
    updateFilterDefaultsOptions.otherFilters
  )

  const [showingModal, setShowingModal] = useState(false)

  const contextValue = useMemo(
    () => ({
      authorFilters: hiddenAuthorList,
      aiNessFilter: aiNess,
      categoryFilters: hiddenCategoryList,
      otherFilters: otherFilters,
    }),
    [hiddenAuthorList, hiddenCategoryList, aiNess, otherFilters]
  )

  const updateDefaultFilters = useEffectEvent(() => {
    setUpdateFilterDefaultsOptions(contextValue)
  })

  useEffect(() => () => updateDefaultFilters(), [])

  const deferedContextValue = useDeferredValue(contextValue)
  const [listRef, setListRef] = useState<HTMLDivElement | null>(null)

  return (
    <div className="update">
      <UpdateControls
        authorList={authorList}
        hiddenAuthorList={hiddenAuthorList}
        setHiddenAuthorList={setHiddenAuthorList}
        categoryList={categoryList}
        hiddenCategoryList={hiddenCategoryList}
        setHiddenCategoryList={setHiddenCategoryList}
        aiNess={aiNess}
        setAiNess={setAiNess}
        otherFilters={otherFilters}
        setOtherFilters={setOtherFilters}
      />
      {!showingModal && (
        <Suspense>
          <UpdateFilterContext value={deferedContextValue}>
            <Overview />
            <CoreList ref={setListRef} />
          </UpdateFilterContext>
        </Suspense>
      )}

      {showingModal && <UpdateModal onClose={() => setShowingModal(false)} />}
      <UpdateOptions
        listElement={listRef}
        onStart={() => setShowingModal(true)}
      />
    </div>
  )
}

type UpdateOptionsProps = {
  onStart: () => void
  listElement: HTMLDivElement | null
}

const UpdateOptions = ({ onStart, listElement }: UpdateOptionsProps) => {
  const { t } = useTranslation("update")
  const [selectedCores, setSelectedCores] = useState<{
    install: string[]
    update: string[]
  }>({ install: [], update: [] })

  const config = useAtomValue(PocketSyncConfigSelector)
  const turboDownloads = useAtomValue(turboDownloadsAtom)

  const startCallback = useCallback(async () => {
    if (config.archive_url === "" || config.archive_url === null) {
      const confirmNoArchiveUrl = await confirm(
        t("no_archive_url_warning.text"),
        {
          title: t("no_archive_url_warning.title"),
          kind: "warning",
        }
      )
      if (!confirmNoArchiveUrl) return
    }

    onStart()

    await invokeInstallAndUpdateCores({
      installList: selectedCores.install,
      updateList: selectedCores.update,
      options: {
        include_alternate_files: !config.skipAlternateAssets,
        retain_platform_files: true,
        archive_url: config.archive_url ?? undefined,
        fast_downloads: turboDownloads.enabled,
      },
    })

    // shouldn't need to do this but the observer might break when the list suspends
    setSelectedCores({ install: [], update: [] })
  }, [config, selectedCores])

  // bad React but I don't care,
  // can't think of a better way to have each core item manage wether it's hidden or shown
  // & also list them all
  useEffect(() => {
    const updateSelectedCores = () => {
      const list = listElement
      setSelectedCores({
        install: Array.from(list?.children ?? [])
          .filter((i) => (i as HTMLElement).dataset.installtype === "install")
          .map((i) => (i as HTMLElement).dataset.corename ?? ""),
        update: Array.from(list?.children ?? [])
          .filter((i) => (i as HTMLElement).dataset.installtype === "update")
          .map((i) => (i as HTMLElement).dataset.corename ?? ""),
      })
    }

    updateSelectedCores()
    const o = new MutationObserver(updateSelectedCores)
    const list = listElement
    if (!list) return
    o.observe(list, { childList: true })

    return () => {
      o.disconnect()
    }
  }, [setSelectedCores, listElement])

  return (
    <div className="update__action-buttons">
      <div className="update__options"></div>
      <button className="update__action-button-start" onClick={startCallback}>
        {t("start_button", {
          update_count: selectedCores.update.length,
          install_count: selectedCores.install.length,
        })}
      </button>
    </div>
  )
}

const UpdateFilterContext = createContext<UpdateFilterOptions>({
  authorFilters: [],
  aiNessFilter: 1,
  categoryFilters: [],
  otherFilters: [],
})

const Overview = () => {
  const { t } = useTranslation("update")
  const coresList = useAtomValue(coresListSelector)
  const inventoryCoreList = useAtomValue(inventoryCoreListAtom)
  const installedCoresWithUpdates = useAtomValue(
    installedCoresWithUpdatesSelector
  )
  const config = useAtomValue(PocketSyncConfigSelector)

  const notInstalledList = useMemo(() => {
    const hiddenItems = config.hidden_cores ?? []
    const installedAndHidden = new Set([...coresList, ...hiddenItems])
    const inventory = new Set(inventoryCoreList)

    return Array.from(inventory.difference(installedAndHidden))
  }, [coresList, inventoryCoreList, config])

  return (
    <div className="update__overview">
      {t("overview", {
        install_count: coresList.length,
        update_count: installedCoresWithUpdates.length,
        not_installed_count: notInstalledList.length,
      })}
    </div>
  )
}

const CoreList = ({ ref }: { ref: Ref<HTMLDivElement> }) => {
  const coresList = useAtomValue(coresListSelector)
  const inventoryCoreList = useAtomValue(inventoryCoreListAtom)
  const installedCoresWithUpdates = useAtomValue(
    installedCoresWithUpdatesSelector
  )

  const notInstalledList = useMemo(() => {
    const installed = new Set(coresList)
    const inventory = new Set(inventoryCoreList)
    return Array.from(inventory.difference(installed))
  }, [coresList, inventoryCoreList])

  return (
    <div className="update__list" ref={ref}>
      {installedCoresWithUpdates.map((i) => (
        <Suspense key={i.coreName}>
          <InstalledCoreItem
            coreName={i.coreName}
            installedVersion={i.installedVersion}
            latestVersion={i.latestVersion}
          />
        </Suspense>
      ))}
      {notInstalledList.map((i) => (
        <Suspense key={i}>
          <NotInstalledCoreItem coreName={i} />
        </Suspense>
      ))}
    </div>
  )
}

const InstalledCoreItem = ({
  coreName,
  installedVersion,
  latestVersion,
}: {
  coreName: string
  installedVersion: string
  latestVersion: string
}) => {
  const { t } = useTranslation("update")
  const coreInventory = useAtomValue(coreInventoryAtom)
  const coreInfo = useAtomValue(CoreInfoSelectorFamily(coreName))
  const platformInfo = useAtomValue(MainPlatformForCoreSelectorFamily(coreName))
  const filterContext = use(UpdateFilterContext)

  const { name, authorName, authorImageUrl, lastUpdatedDate, category } =
    useMemo(() => {
      const foundCore = coreInventory.cores.data.find((c) => c.id === coreName)
      if (!foundCore) throw new Error("huh")
      const [authorName, name] = coreName.split(".")

      return {
        name,
        authorName,
        authorImageUrl: `https://openfpga-library.github.io/analogue-pocket/assets/images/authors/${coreName}.png`,
        lastUpdatedDate: new Date(
          foundCore.releases[0].core.metadata.date_release
        ),
        version: foundCore.releases[0].core.metadata.version,
        category: platformInfo?.platform.category ?? "",
      }
    }, [coreInfo, platformInfo])

  if (
    filterContext.authorFilters.includes(authorName) ||
    filterContext.categoryFilters.includes(category) ||
    filterContext.otherFilters.includes("update")
  ) {
    return null
  }

  return (
    <div
      className="update__list-item"
      data-corename={coreName}
      data-installtype="update"
    >
      <Suspense>
        <OnlyLoadsWhenShown height={40} className="update__list-item-name">
          <InstalledCoreImage coreName={coreName} />
        </OnlyLoadsWhenShown>
      </Suspense>
      <div className="update__list-item-name">{name}</div>
      <div className="update__list-item-author">
        <img className="update__list-item-author-image" src={authorImageUrl} />
        <div className="update__list-item-author-name">{authorName}</div>
      </div>

      <div className="update__list-item-version">
        <div className="update__list-item-version-old">{installedVersion}</div>
        <ArrowIcon />
        <div className="update__list-item-version-new">{latestVersion}</div>
      </div>
      <div className="update__list-item-date">
        {`${category}, `}
        {t("last_update_date", { date: lastUpdatedDate })}
      </div>
    </div>
  )
}

const NotInstalledCoreItem = ({ coreName }: { coreName: string }) => {
  const { t } = useTranslation("update")
  const coreInventory = useAtomValue(coreInventoryAtom)
  const filterContext = use(UpdateFilterContext)
  const config = useAtomValue(PocketSyncConfigSelector)

  const {
    name,
    authorName,
    authorImageUrl,
    lastUpdatedDate,
    version,
    requiresLicense,
    category,
  } = useMemo(() => {
    const foundCore = coreInventory.cores.data.find((c) => c.id === coreName)
    if (!foundCore) throw new Error("huh")
    const foundMainPlatform = coreInventory.platforms.data.find(
      (p) => p.id === foundCore?.releases[0].core.metadata.platform_ids[0]
    )
    const [authorName, name] = coreName.split(".")

    return {
      name,
      authorName,
      authorImageUrl: `https://openfpga-library.github.io/analogue-pocket/assets/images/authors/${coreName}.png`,
      lastUpdatedDate: new Date(
        foundCore.releases[0].core.metadata.date_release
      ),
      version: foundCore.releases[0].core.metadata.version,
      requiresLicense: foundCore.releases[0].requires_license,
      category: foundMainPlatform?.category || "",
    }
  }, [coreName])

  const aiCheck = useAtomValue(aiCheckAtom)
  const coreAIScore = useMemo(
    () => aiCheck[coreName]?.overall_score ?? 0,
    [coreName, aiCheck]
  )

  if (
    filterContext.authorFilters.includes(authorName) ||
    filterContext.categoryFilters.includes(category) ||
    (filterContext.otherFilters.includes(
      `requires_${authorName as "jotego" | "coc"}_license`
    ) &&
      requiresLicense) ||
    (filterContext.otherFilters.includes("analogizer") &&
      coreName.endsWith("_Analogizer")) ||
    coreAIScore > filterContext.aiNessFilter ||
    filterContext.otherFilters.includes("install") ||
    config.hidden_cores?.includes(coreName)
  ) {
    return null
  }

  return (
    <div
      className="update__list-item"
      data-corename={coreName}
      data-installtype="install"
    >
      <Suspense>
        <NotInstalledCoreImage coreName={coreName} />
      </Suspense>
      <div className="update__list-item-name">{name}</div>
      <div className="update__list-item-author">
        <img className="update__list-item-author-image" src={authorImageUrl} />
        <div className="update__list-item-author-name">{authorName}</div>
      </div>

      <div className="update__list-item-version">
        <div className="update__list-item-version-new">{version}</div>
      </div>
      <div className="update__list-item-date">
        {`${category}, `}
        {t("last_update_date", { date: lastUpdatedDate })}
      </div>
      {requiresLicense && (
        <div
          className="update__list-item-license"
          title={t("requires_license")}
        >
          <KeyIcon />
        </div>
      )}

      {coreAIScore > 0 && (
        <div className="update__list-item-ai-score">
          {t("ai_score", { score: coreAIScore })}
        </div>
      )}
    </div>
  )
}

const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="currentColor"
  >
    <path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z" />
  </svg>
)
