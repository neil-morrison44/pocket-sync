import {
  ReactNode,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  ScreenshotInfo as ScreenshotInfoData,
  screenshotsInfoKeptSelector,
  screenshotsListSelector,
} from "../../jotai/screenshots/selectors"
import { Screenshot } from "./item"

import "./index.css"
import { ScreenshotInfo } from "./info"
import { Grid } from "../grid"
import { useSaveScroll } from "../../hooks/useSaveScroll"
import { Controls, ControlsActions } from "../controls"
import { selectedSubviewSelector } from "../../jotai/view/selectors"
import { useMultiExport } from "./hooks/useMultiExport"
import { invokeDeleteFiles } from "../../utils/invokes"
import { Trans, useTranslation } from "react-i18next"
import ButtonCombo from "../ui/ButtonCombo"
import EmptyState from "../ui/EmptyState"
import NoResults from "../ui/NoResults"
import { ControlsSearch } from "../controls/inputs/search"
import { ControlsGroup } from "../controls/inputs/group"
import { ControlsButton } from "../controls/inputs/button"
import { ControlsCheckbox } from "../controls/inputs/checkbox"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { TFunction } from "i18next"
import Select from "../ui/Select"
import IconButton from "../ui/IconButton"
import Skeleton from "../ui/Skeleton"
import { GroupHeader } from "../shared/groupHeader"
import { Link } from "../link"
import { currentViewAtom } from "../../jotai/view/atoms"
import { useOpenGame } from "../../hooks/useOpenGame"
import { gameDisplayName } from "../../utils/gameName"
import { atomWithAppLocalSetting } from "../../utils/jotai"

/** How the screenshots are grouped into sections. */
type GroupBy = "game" | "core" | "date"

/** The grouping, remembered between visits. */
const screenshotsGroupByAtom = atomWithAppLocalSetting<GroupBy>(
  "ui_screenshots_group_by",
  "game"
)

type ScreenshotGroup = {
  key: string
  title: ReactNode
  items: ScreenshotInfoData[]
}

const ALL = "All"

export const Screenshots = () => {
  const [selected, setSelected] = useAtom(selectedSubviewSelector)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectMode, setSelectMode] = useState(false)
  const [selectedScreenshots, setSelectedScreenshots] = useState<string[]>([])
  const [groupBy, setGroupBy] = useAtom(screenshotsGroupByAtom)
  const [gameFilter, setGameFilter] = useState(ALL)
  const [coreFilter, setCoreFilter] = useState(ALL)
  const { t } = useTranslation("screenshots")
  const { t: tInfo } = useTranslation("screenshot_info")

  const screenshots = useAtomValue(screenshotsListSelector)
  // Undefined until every screenshot's info is read; kept while it reloads
  const infos = useAtomValue(screenshotsInfoKeptSelector)
  const exportMulti = useMultiExport()
  const { pushScroll, popScroll } = useSaveScroll()

  const deleteScreenshots = useCallback(async (screenshots: string[]) => {
    await invokeDeleteFiles(screenshots.map((s) => `Memories/Screenshots/${s}`))

    setSelectedScreenshots([])
  }, [])

  const groups = useMemo(
    () =>
      groupScreenshots(
        filterScreenshots(infos ?? [], {
          query: searchQuery,
          game: gameFilter,
          core: coreFilter,
        }),
        groupBy,
        t
      ),
    [infos, searchQuery, gameFilter, coreFilter, groupBy, t]
  )

  // Previous / next follow the order on screen
  const orderedScreenshots = useMemo(() => {
    const ordered = groups.flatMap(({ items }) =>
      items.map(({ fileName }) => fileName)
    )
    return ordered.length > 0
      ? ordered
      : [...screenshots].sort((a, b) => b.localeCompare(a))
  }, [groups, screenshots])

  const changeSelectedImage = useCallback(
    (change: number) => {
      if (selected === null) return
      const selectedIndex = orderedScreenshots.findIndex((s) => s === selected)
      let newIndex = selectedIndex + change
      if (newIndex < 0) newIndex = orderedScreenshots.length - 1
      if (newIndex >= orderedScreenshots.length) newIndex = 0

      startTransition(() => setSelected(orderedScreenshots[newIndex]))
    },
    [setSelected, selected, orderedScreenshots]
  )

  useEffect(() => {
    const listener = ({ key }: KeyboardEvent) => {
      if (key === "ArrowLeft") {
        changeSelectedImage(-1)
      } else if (key === "ArrowRight") {
        changeSelectedImage(+1)
      }
    }
    document.addEventListener("keydown", listener)
    return () => document.removeEventListener("keydown", listener)
  }, [changeSelectedImage])

  if (selected) {
    return (
      <>
        {/* Real buttons, so they can be reached and seen with the keyboard;
            the arrow keys also work */}
        <IconButton
          className="screenshots__button screenshots__button--previous"
          theme="tertiary"
          icon="chevron-left"
          label={tInfo("controls.previous")}
          tooltipSide="right"
          onClick={() => changeSelectedImage(-1)}
        />
        <IconButton
          className="screenshots__button screenshots__button--next"
          theme="tertiary"
          icon="chevron-right"
          label={tInfo("controls.next")}
          tooltipSide="left"
          onClick={() => changeSelectedImage(1)}
        />
        <ScreenshotInfo
          fileName={selected}
          onBack={() => {
            setSelected(null)
            popScroll()
          }}
        />
      </>
    )
  }

  if (screenshots.length === 0) {
    return (
      <EmptyState icon="image" title={t("empty_title")} fullPage>
        {t("no_screenshots")}
        <HowToScreenshot />
      </EmptyState>
    )
  }

  const toggle = (fileName: string) =>
    setSelectedScreenshots((s) =>
      s.includes(fileName) ? s.filter((f) => f !== fileName) : [...s, fileName]
    )

  return (
    <>
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
            { value: "date", label: t("controls.group.date") },
          ]}
        />
        <ControlsGroup
          onClear={
            gameFilter !== ALL || coreFilter !== ALL
              ? () => {
                  setGameFilter(ALL)
                  setCoreFilter(ALL)
                }
              : undefined
          }
        >
          <Select
            label={t("controls.game")}
            active={gameFilter !== ALL}
            value={gameFilter}
            onChange={setGameFilter}
            searchable
            searchPlaceholder={t("controls.search")}
            options={[
              { value: ALL, label: t("controls.all") },
              ...uniqueSorted((infos ?? []).map(({ game }) => game)).map(
                (game) => ({ value: game, label: gameDisplayName(game) })
              ),
            ]}
          />
          <Select
            label={t("controls.core")}
            active={coreFilter !== ALL}
            value={coreFilter}
            onChange={setCoreFilter}
            searchable
            searchPlaceholder={t("controls.search")}
            options={[
              { value: ALL, label: t("controls.all") },
              ...uniqueSorted(
                (infos ?? []).map(({ core }) => core).filter(Boolean)
              ).map((core) => ({ value: core })),
            ]}
          />
        </ControlsGroup>
        {/* Select is an action (export, delete), so it sits at the right */}
        <ControlsActions>
          <ControlsCheckbox
            checked={selectMode}
            onChange={(checked) => {
              setSelectedScreenshots([])
              setSelectMode(checked)
            }}
          >
            {t("controls.select")}
          </ControlsCheckbox>
          {selectMode && (
            <>
              <ControlsButton onClick={() => exportMulti(selectedScreenshots)}>
                {t("controls.export_selected", {
                  count: selectedScreenshots.length,
                })}
              </ControlsButton>
              <ControlsButton
                theme="destructive"
                icon="trash"
                onClick={() => deleteScreenshots(selectedScreenshots)}
              >
                {t("controls.delete_selected", {
                  count: selectedScreenshots.length,
                })}
              </ControlsButton>
            </>
          )}
        </ControlsActions>
      </Controls>

      <div className="search-results">
        {infos === undefined ? (
          <div className="grid screenshots" aria-hidden>
            {screenshots.slice(0, 12).map((fileName) => (
              <Skeleton key={fileName} className="screenshots__skeleton" />
            ))}
          </div>
        ) : (
          groups.map((group) => (
            <section className="screenshots__group" key={group.key}>
              <GroupHeader
                title={group.title}
                count={t("count", { count: group.items.length })}
              />
              <Grid className="screenshots">
                {group.items.map(({ fileName }) => (
                  <Suspense
                    fallback={<Skeleton className="screenshots__skeleton" />}
                    key={fileName}
                  >
                    <Screenshot
                      fileName={fileName}
                      selected={
                        selectMode && selectedScreenshots.includes(fileName)
                      }
                      onClick={() => {
                        if (selectMode) {
                          toggle(fileName)
                        } else {
                          pushScroll()
                          setSelected(fileName)
                        }
                      }}
                    />
                  </Suspense>
                ))}
              </Grid>
            </section>
          ))
        )}
        <NoResults />
      </div>
    </>
  )
}

const uniqueSorted = (values: string[]) =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))

/** Search (game, platform, core, file name) and the game / core filters. */
const filterScreenshots = (
  infos: ScreenshotInfoData[],
  { query, game, core }: { query: string; game: string; core: string }
) => {
  const search = query.toLowerCase().trim()
  return infos.filter(
    (info) =>
      (game === ALL || info.game === game) &&
      (core === ALL || info.core === core) &&
      (!search ||
        [info.game, info.platform, info.core, info.fileName].some((field) =>
          field.toLowerCase().includes(search)
        ))
  )
}

/**
 * Sections by game or core (by name), or by day (newest first); newest
 * screenshots first inside each.
 */
const groupScreenshots = (
  infos: ScreenshotInfoData[],
  groupBy: GroupBy,
  t: TFunction<"screenshots">
): ScreenshotGroup[] => {
  const newestFirst = [...infos].sort((a, b) =>
    b.fileName.localeCompare(a.fileName)
  )
  const groups = new Map<string, ScreenshotGroup>()

  for (const info of newestFirst) {
    const key =
      groupBy === "game"
        ? info.game
        : groupBy === "core"
          ? info.core
          : info.timestamp
            ? info.timestamp.toDateString()
            : ""
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title: <GroupTitle groupBy={groupBy} info={info} t={t} />,
        items: [],
      })
    }
    groups.get(key)?.items.push(info)
  }

  const list = Array.from(groups.values())
  if (groupBy === "date") return list
  // By name; the unknown group last
  return list.sort((a, b) =>
    !a.key ? 1 : !b.key ? -1 : a.key.localeCompare(b.key)
  )
}

/** A section's title: the game or core (links), or the day. */
const GroupTitle = ({
  groupBy,
  info,
  t,
}: {
  groupBy: GroupBy
  info: ScreenshotInfoData
  t: TFunction<"screenshots">
}) => {
  const openGame = useOpenGame()
  const setView = useSetAtom(currentViewAtom)

  if (groupBy === "game") {
    if (!info.game) return t("unknown_game")
    return (
      <Link subtle onClick={() => openGame(info.game)}>
        {gameDisplayName(info.game)}
      </Link>
    )
  }
  if (groupBy === "core") {
    if (!info.core) return t("unknown_core")
    return (
      <Link
        subtle
        onClick={() =>
          startTransition(() => setView({ view: "Cores", selected: info.core }))
        }
      >
        {info.core}
      </Link>
    )
  }
  if (!info.timestamp) return t("unknown_date")
  return t("group_date", { date: info.timestamp })
}

/** How to take a screenshot on the Pocket: Analogue button + Start. */
const HowToScreenshot = () => {
  const { t } = useTranslation("screenshots")

  return (
    <div className="screenshots__how-to">
      <ButtonCombo keys={["analogue", "start"]} size={40} />
      <span>
        {/* The Pocket's button names stand out, like the lit buttons above */}
        <Trans
          t={t}
          i18nKey="how_to"
          components={{ key: <strong className="screenshots__key" /> }}
        />
      </span>
    </div>
  )
}
