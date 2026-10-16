import {
  ReactNode,
  startTransition,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react"

import {
  AllSaveStatesSelector,
  saveStateGamesSelector,
  saveStatePlatformsSelector,
  saveStatesInfoSelector,
} from "../../jotai/saveStates/selectors"
import Select from "../ui/Select"
import EmptyState from "../ui/EmptyState"
import NoResults from "../ui/NoResults"
import ButtonCombo from "../ui/ButtonCombo"
import { SaveStateItem } from "./item"
import { Grid } from "../grid"
import { CardSkeleton } from "../ui/Skeleton"

import "./index.css"
import { Controls, ControlsActions } from "../controls"
import { SearchContextProvider } from "../search/context"
import { confirm } from "@tauri-apps/plugin-dialog"
import { invokeDeleteFiles } from "../../utils/invokes"
import { splitAsPath } from "../../utils/splitAsPath"
import { Link } from "../link"
import {
  CoreAuthorImageSelectorFamily,
  CoreMainPlatformIdSelectorFamily,
} from "../../jotai/selectors"
import {
  PlatformExistsSelectorFamily,
  PlatformInfoSelectorFamily,
} from "../../jotai/platforms/selectors"
import { currentViewAtom } from "../../jotai/view/atoms"
import { Trans, useTranslation } from "react-i18next"
import { PhotoExportModal } from "./photoExportModal"
import { ControlsSearch } from "../controls/inputs/search"
import { ControlsGroup } from "../controls/inputs/group"
import { ControlsButton } from "../controls/inputs/button"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { GroupHeader } from "../shared/groupHeader"
import { useOpenGame } from "../../hooks/useOpenGame"
import { gameDisplayName } from "../../utils/gameName"
import { atomWithAppLocalSetting } from "../../utils/jotai"

/** The group key for save states made with a cartridge, not a core. */
const CARTRIDGE = "Native"

/** Save states in sections per game (the default) or per core. */
const saveStatesGroupByAtom = atomWithAppLocalSetting<"core" | "game">(
  "ui_save_states_group_by",
  "game"
)

/** A horizontal tile's height: 120px × 9/10 image plus 2 × 10px padding. */
const SAVE_STATE_TILE_HEIGHT = 128

export const SaveStates = () => {
  const allSaveStates = useAtomValue(AllSaveStatesSelector)
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [coreFilter, setCoreFilter] = useState("All")
  const [platformFilter, setPlatformFilter] = useState("All")
  const [gameFilter, setGameFilter] = useState("All")
  const [groupBy, setGroupBy] = useAtom(saveStatesGroupByAtom)
  const { t } = useTranslation("save_states")

  const [isExportingPhotos, setIsExportingPhotos] = useState<string | null>(
    null
  )

  // Cartridge first, then the cores by name
  const groups = useMemo(() => {
    const byCore = allSaveStates.reduce(
      (g, p) => {
        const pathSplit = splitAsPath(p)
        const coreName = pathSplit.length > 1 ? pathSplit[0] : CARTRIDGE
        ;(g[coreName] ??= []).push(p)
        return g
      },
      {} as { [k: string]: string[] }
    )
    return Object.entries(byCore).sort(([a], [b]) =>
      a === CARTRIDGE ? -1 : b === CARTRIDGE ? 1 : a.localeCompare(b)
    )
  }, [allSaveStates])

  const deleteSelected = useCallback(async () => {
    const okToDelete = await confirm(
      t("confirm_delete", { count: selectedStates.length })
    )
    if (!okToDelete) return

    await invokeDeleteFiles(
      selectedStates.map((s) => `Memories/Save States/${s}`)
    )
    setSelectedStates([])
  }, [selectedStates, t])

  const searchFilters = useMemo(
    () => ({ platform: platformFilter, game: gameFilter }),
    [platformFilter, gameFilter]
  )

  const toggle = useCallback(
    (path: string) =>
      setSelectedStates((s) =>
        s.includes(path) ? s.filter((os) => os !== path) : [...s, path]
      ),
    []
  )

  const renderGrid = (paths: string[]) => (
    // Placeholders as tall as a horizontal tile (10:9 image, 120px wide, plus
    // padding); taller ones flashed a dark wall that collapsed on load
    <Grid
      className="save-states__items"
      placeholderItemHeight={SAVE_STATE_TILE_HEIGHT}
    >
      {paths.map((p) => (
        <Suspense
          fallback={
            <CardSkeleton
              height={SAVE_STATE_TILE_HEIGHT}
              orientation="horizontal"
            />
          }
          key={p}
        >
          <SaveStateItem
            path={p}
            selected={selectedStates.includes(p)}
            onClick={() => toggle(p)}
            onExportPhotos={() => setIsExportingPhotos(p)}
          />
        </Suspense>
      ))}
    </Grid>
  )

  return (
    <div className="save-states">
      <Controls>
        <ControlsSearch
          placeholder={t("controls.search")}
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <Select
          label={t("controls.group_by")}
          value={groupBy}
          onChange={setGroupBy}
          options={[
            { value: "game", label: t("controls.group.game") },
            { value: "core", label: t("controls.group.core") },
          ]}
        />
        <ControlsGroup
          onClear={
            gameFilter !== "All" ||
            coreFilter !== "All" ||
            platformFilter !== "All"
              ? () => {
                  setGameFilter("All")
                  setCoreFilter("All")
                  setPlatformFilter("All")
                }
              : undefined
          }
        >
          <Suspense>
            <GameFilter value={gameFilter} onChange={setGameFilter} />
          </Suspense>
          <Select
            label={t("controls.core")}
            active={coreFilter !== "All"}
            value={coreFilter}
            onChange={setCoreFilter}
            options={[
              { value: "All", label: t("controls.all") },
              ...groups.map(([coreName]) => ({
                value: coreName,
                label: coreName === CARTRIDGE ? t("cartridge") : coreName,
              })),
            ]}
          />
          <Suspense>
            <PlatformFilter
              value={platformFilter}
              onChange={setPlatformFilter}
            />
          </Suspense>
        </ControlsGroup>
        <ControlsActions>
          {selectedStates.length !== 0 && (
            <>
              <ControlsButton onClick={() => setSelectedStates([])}>
                {t("controls.clear_selection")}
              </ControlsButton>
              <ControlsButton
                theme="destructive"
                icon="trash"
                onClick={deleteSelected}
              >
                {t("controls.delete_selection", {
                  count: selectedStates.length,
                })}
              </ControlsButton>
            </>
          )}
        </ControlsActions>
      </Controls>

      {isExportingPhotos && (
        <PhotoExportModal
          path={isExportingPhotos}
          onClose={() => setIsExportingPhotos(null)}
        />
      )}

      {allSaveStates.length === 0 && (
        <EmptyState icon="clock" title={t("empty.title")}>
          {t("empty.text")}
          <HowToSaveStates />
        </EmptyState>
      )}

      <SearchContextProvider query={searchQuery} other={searchFilters}>
        <div className="search-results">
          {groupBy === "game" ? (
            <Suspense fallback={<SaveStatesSkeleton />}>
              <GameGroups coreFilter={coreFilter} renderGrid={renderGrid} />
            </Suspense>
          ) : (
            groups
              .filter(
                ([coreName]) => coreFilter === "All" || coreName === coreFilter
              )
              .map(([coreName, saveStates]) => (
                <section className="save-states__group" key={coreName}>
                  {coreName === CARTRIDGE ? (
                    <GroupHeader
                      title={t("cartridge")}
                      count={t("count", { count: saveStates.length })}
                    />
                  ) : (
                    <Suspense fallback={<GroupHeader title={coreName} />}>
                      <CoreNameHeader
                        coreName={coreName}
                        count={saveStates.length}
                      />
                    </Suspense>
                  )}
                  {renderGrid(saveStates)}
                </section>
              ))
          )}
          {allSaveStates.length > 0 && <NoResults />}
        </div>
      </SearchContextProvider>
    </div>
  )
}

/**
 * How to make and load a save state ("Memory") on the Pocket: Analogue
 * button + Up saves, Analogue button + Down loads the latest one.
 */
const HowToSaveStates = () => {
  const { t } = useTranslation("save_states")
  // The Pocket's button and menu names stand out, like the lit buttons
  const components = { key: <strong className="save-states__key" /> }

  return (
    <div className="save-states__how-to">
      <div className="save-states__how-to-step">
        <ButtonCombo keys={["analogue", "up"]} size={40} />
        <span>
          <Trans t={t} i18nKey="how_to.save" components={components} />
        </span>
      </div>
      <div className="save-states__how-to-step">
        <ButtonCombo keys={["analogue", "down"]} size={40} />
        <span>
          <Trans t={t} i18nKey="how_to.load" components={components} />
        </span>
      </div>
    </div>
  )
}

/** Only shows save states from one platform. */
const PlatformFilter = ({
  value,
  onChange,
}: {
  value: string
  onChange: (platform: string) => void
}) => {
  const platforms = useAtomValue(saveStatePlatformsSelector)
  const { t } = useTranslation("save_states")
  return (
    <Select
      label={t("controls.platform")}
      active={value !== "All"}
      value={value}
      onChange={onChange}
      searchable={platforms.length > 8}
      searchPlaceholder={t("controls.search")}
      options={[
        { value: "All", label: t("controls.all") },
        ...platforms.map((platform) => ({ value: platform })),
      ]}
    />
  )
}

/**
 * The core's full name (author and short name, like its folder, e.g.
 * "Spiritualized.GBC") opens the core; the platform's name follows it. A
 * short name alone often reads like the platform. The count is out of the
 * Pocket's 128 save states per core.
 */
const CoreNameHeader = ({
  coreName,
  count,
}: {
  coreName: string
  count: number
}) => {
  const { t } = useTranslation("save_states")
  const authorImageSrc = useAtomValue(CoreAuthorImageSelectorFamily(coreName))
  const viewCore = useSetAtom(currentViewAtom)
  return (
    <GroupHeader
      title={
        <>
          <img
            className="save-states__core-avatar"
            src={authorImageSrc}
            alt=""
          />
          <Link
            subtle
            onClick={() =>
              startTransition(() =>
                viewCore({ view: "Cores", selected: coreName })
              )
            }
          >
            {coreName}
          </Link>
        </>
      }
      detail={
        <Suspense>
          <CorePlatformName coreName={coreName} />
        </Suspense>
      }
      count={t("count", { count })}
    />
  )
}

/**
 * Save states in sections by game (by name); the game opens Games searched
 * for it. Reads every save state's game, so it loads on its own.
 */
const GameGroups = ({
  coreFilter,
  renderGrid,
}: {
  coreFilter: string
  renderGrid: (paths: string[]) => ReactNode
}) => {
  const infos = useAtomValue(saveStatesInfoSelector)
  const { t } = useTranslation("save_states")
  const openGame = useOpenGame()

  const groups = useMemo(() => {
    const byGame = new Map<string, string[]>()
    for (const { path, game } of infos) {
      const pathSplit = splitAsPath(path)
      const coreName = pathSplit.length > 1 ? pathSplit[0] : CARTRIDGE
      if (coreFilter !== "All" && coreName !== coreFilter) continue
      byGame.set(game, [...(byGame.get(game) ?? []), path])
    }
    return Array.from(byGame.entries()).sort(([a], [b]) =>
      !a ? 1 : !b ? -1 : a.localeCompare(b)
    )
  }, [infos, coreFilter])

  return groups.map(([game, paths]) => (
    <section className="save-states__group" key={game}>
      <GroupHeader
        title={
          game ? (
            <Link subtle onClick={() => openGame(game)}>
              {gameDisplayName(game)}
            </Link>
          ) : (
            t("unknown_game")
          )
        }
        count={t("count_game", { count: paths.length })}
      />
      {renderGrid(paths)}
    </section>
  ))
}

const SaveStatesSkeleton = () => (
  <div className="grid save-states__items" aria-hidden>
    {Array.from({ length: 6 }, (_, index) => (
      <CardSkeleton
        key={index}
        height={SAVE_STATE_TILE_HEIGHT}
        orientation="horizontal"
      />
    ))}
  </div>
)

/** Only shows save states of one game. */
const GameFilter = ({
  value,
  onChange,
}: {
  value: string
  onChange: (game: string) => void
}) => {
  const games = useAtomValue(saveStateGamesSelector)
  const { t } = useTranslation("save_states")
  return (
    <Select
      label={t("controls.game")}
      active={value !== "All"}
      value={value}
      onChange={onChange}
      searchable
      searchPlaceholder={t("controls.search")}
      options={[
        { value: "All", label: t("controls.all") },
        ...games.map((game) => ({ value: game, label: gameDisplayName(game) })),
      ]}
    />
  )
}

/** The core's main platform, e.g. "Game Boy Color"; nothing if it's missing. */
const CorePlatformName = ({ coreName }: { coreName: string }) => {
  const platformId = useAtomValue(CoreMainPlatformIdSelectorFamily(coreName))
  const exists = useAtomValue(PlatformExistsSelectorFamily(platformId))
  if (!exists) return null
  return <PlatformName platformId={platformId} />
}

const PlatformName = ({ platformId }: { platformId: string }) => {
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(platformId))
  return platform.name
}
