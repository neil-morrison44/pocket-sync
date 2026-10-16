import { ReactNode, startTransition, useMemo } from "react"
import { Link } from "../link"
import { useAtomValue, useSetAtom } from "jotai"
import { currentViewAtom } from "../../jotai/view/atoms"
import { platformFilterOptionAtom } from "../../jotai/cores/atoms"
import Button from "../ui/Button"
import { useTranslation } from "react-i18next"
import { fuzzy } from "fast-fuzzy"
import { sep } from "@tauri-apps/api/path"
import {
  GameSystem,
  GameSystemPlatformSelectorFamily,
  filterGameFiles,
} from "../../jotai/games/selectors"
import { WalkDirSelectorFamily } from "../../jotai/selectors"
import { pocketPathAtom } from "../../jotai/atoms"
import { invokeCreateFolderIfMissing } from "../../utils/invokes"
import { openFolder, revealFile } from "../../utils/openFolder"
import { useSearchContext } from "../search/context"
import IconButton from "../ui/IconButton"
import Skeleton from "../ui/Skeleton"
import Tag from "../ui/Tag"

const SEARCH_THRESHOLD = 0.8

type GameSystemSectionProps = {
  system: GameSystem
  /**
   * Leaves out the header (name, tags, actions), e.g. on the platform's own
   * page, where it would repeat the title.
   */
  embedded?: boolean
  /** Shown instead of nothing when there are no games. */
  emptyFallback?: ReactNode
}

/** One system (SD card folder `Assets/<platform>`) and the games in it. */
export const GameSystemSection = ({
  system,
  embedded = false,
  emptyFallback = null,
}: GameSystemSectionProps) => {
  const platform = useAtomValue(
    GameSystemPlatformSelectorFamily(system.platformId)
  )
  const files = useAtomValue(
    WalkDirSelectorFamily({
      path: `Assets/${system.platformId}`,
      extensions: system.extensions,
    })
  )
  const pocketPath = useAtomValue(pocketPathAtom)
  const { query, other } = useSearchContext()
  const setView = useSetAtom(currentViewAtom)
  const setCorePlatformFilter = useSetAtom(platformFilterOptionAtom)

  // Cores for this platform, via the Cores list's platform filter
  const findCore = () =>
    startTransition(() => {
      setCorePlatformFilter(system.platformId)
      setView({ view: "Cores", selected: null })
    })
  const { t } = useTranslation("games")

  const games = useMemo(() => {
    const separator = sep()
    return filterGameFiles(files, system.namedFiles)
      .map((file) => {
        const parts = file.split(separator).filter(Boolean)
        return {
          path: file,
          parts,
          name: parts.at(-1) ?? file,
          folder: parts.slice(0, -1).join(" / "),
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [files, system.namedFiles])

  const visibleGames = useMemo(() => {
    const search = query.toLowerCase().trim()
    if (!search) return games
    const systemMatches =
      fuzzy(search, platform.name.toLowerCase()) > SEARCH_THRESHOLD
    if (systemMatches) return games
    return games.filter(
      ({ name }) => fuzzy(search, name.toLowerCase()) > SEARCH_THRESHOLD
    )
  }, [games, query, platform.name])

  const platformFilter = other?.platform
  if (
    platformFilter &&
    platformFilter !== "All" &&
    platformFilter !== system.platformId
  )
    return null
  if (visibleGames.length === 0) return emptyFallback

  const folder = `${pocketPath}/Assets/${system.platformId}`
  const titleId = `games-system-${system.platformId}`

  return (
    <section className="games__system" aria-labelledby={titleId}>
      {!embedded && (
        <header className="games__system-header">
          <div className="games__system-heading">
            <h3 className="games__system-title" id={titleId}>
              {/* Opens the platform when the card has its file */}
              {platform.exists ? (
                <Link
                  subtle
                  onClick={() =>
                    startTransition(() =>
                      setView({
                        view: "Platforms",
                        selected: system.platformId,
                      })
                    )
                  }
                >
                  {platform.name}
                </Link>
              ) : (
                platform.name
              )}
              {platform.category && <Tag>{platform.category}</Tag>}
              {system.cores.length === 0 && (
                <Tag theme="warning" icon="warning-diamond">
                  {t("no_core")}
                </Tag>
              )}
            </h3>
            <span className="games__system-meta">
              {[
                platform.manufacturer,
                t("item.game_count", { count: games.length }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          {system.cores.length === 0 && (
            <Button
              className="games__find-core"
              icon="search"
              onClick={findCore}
            >
              {t("find_core")}
            </Button>
          )}
          <IconButton
            theme="tertiary"
            icon="folder"
            label={t("open_folder")}
            onClick={async () => {
              await invokeCreateFolderIfMissing(folder)
              openFolder(folder)
            }}
          />
        </header>
      )}
      <ul className="games__list">
        {visibleGames.map(({ path, parts, name, folder: subfolder }) => (
          <li key={path} className="games__game">
            <span className="games__game-name">{name}</span>
            {name.includes(".") && (
              <Tag className="games__game-type">
                {name.split(".").pop()?.toUpperCase()}
              </Tag>
            )}
            {subfolder && (
              <span className="games__game-folder">{subfolder}</span>
            )}
            <IconButton
              theme="tertiary"
              icon="folder"
              label={t("show_in_folder")}
              className="games__game-reveal"
              onClick={() => revealFile(`${folder}/${parts.join("/")}`)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Placeholder while a system's games load. */
export const GameSystemSkeleton = () => (
  <div className="games__system" aria-hidden>
    <div className="games__system-header">
      <Skeleton width="30%" height="1.25em" />
    </div>
    <div className="games__skeleton-rows">
      <Skeleton width="55%" />
      <Skeleton width="40%" />
      <Skeleton width="48%" />
    </div>
  </div>
)
