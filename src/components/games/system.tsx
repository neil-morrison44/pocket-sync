import { useMemo } from "react"
import { useAtomValue } from "jotai"
import { useTranslation } from "react-i18next"
import { fuzzy } from "fast-fuzzy"
import { sep } from "@tauri-apps/api/path"
import { GameSystem, filterGameFiles } from "../../jotai/games/selectors"
import { PlatformInfoSelectorFamily } from "../../jotai/platforms/selectors"
import { WalkDirSelectorFamily } from "../../jotai/selectors"
import { pocketPathAtom } from "../../jotai/atoms"
import { invokeCreateFolderIfMissing } from "../../utils/invokes"
import { openFolder } from "../../utils/openFolder"
import { useSearchContext } from "../search/context"
import IconButton from "../ui/IconButton"
import Skeleton from "../ui/Skeleton"

const SEARCH_THRESHOLD = 0.8

/** One system (SD card folder `Assets/<platform>`) and the games in it. */
export const GameSystemSection = ({ system }: { system: GameSystem }) => {
  const { platform } = useAtomValue(
    PlatformInfoSelectorFamily(system.platformId)
  )
  const files = useAtomValue(
    WalkDirSelectorFamily({
      path: `Assets/${system.platformId}`,
      extensions: system.extensions,
    })
  )
  const pocketPath = useAtomValue(pocketPathAtom)
  const { query, other } = useSearchContext()
  const { t } = useTranslation("games")

  const games = useMemo(() => {
    const separator = sep()
    return filterGameFiles(files, system.namedFiles)
      .map((file) => {
        const parts = file.split(separator).filter(Boolean)
        return {
          path: file,
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

  const category = other?.category
  if (category && category !== "All" && platform.category !== category)
    return null
  if (visibleGames.length === 0) return null

  const folder = `${pocketPath}/Assets/${system.platformId}`
  const titleId = `games-system-${system.platformId}`

  return (
    <section className="games__system" aria-labelledby={titleId}>
      <header className="games__system-header">
        <div className="games__system-heading">
          <h3 className="games__system-title" id={titleId}>
            {platform.name}
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
      <ul className="games__list">
        {visibleGames.map(({ path, name, folder: subfolder }) => (
          <li key={path} className="games__game">
            <span className="games__game-name">{name}</span>
            {subfolder && (
              <span className="games__game-folder">{subfolder}</span>
            )}
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
