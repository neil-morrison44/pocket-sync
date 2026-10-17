import { Suspense, useState } from "react"
import { Controls, ControlsActions } from "../controls"
import { SearchContextProvider } from "../search/context"
import NoResults from "../ui/NoResults"
import { InstanceJson } from "./instanceJson"
import { CleanFilesModal } from "./cleanFiles"
import { useTranslation } from "react-i18next"
import { ControlsSearch } from "../controls/inputs/search"
import { ControlsGroup } from "../controls/inputs/group"
import { ControlsButton } from "../controls/inputs/button"
import { useAtom, useAtomValue } from "jotai"
import { gamesSearchAtom } from "../../jotai/view/atoms"
import { CoreConditional } from "../shared/coreConditional"
import { MROMModal } from "./mrom"
import {
  gameSystemCategoriesSelector,
  gameSystemOptionsSelector,
  gameSystemsSelector,
} from "../../jotai/games/selectors"
import Select from "../ui/Select"
import { GameSystemSection, GameSystemSkeleton } from "./system"
import EmptyState from "../ui/EmptyState"
import "./index.css"

export const Games = () => {
  const systems = useAtomValue(gameSystemsSelector)
  // An atom, so a screenshot or save state can open Games searched for it
  const [searchQuery, setSearchQuery] = useAtom(gamesSearchAtom)
  const [filterPlatform, setFilterPlatform] = useState<string>("All")
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const [cleanFilesOpen, setCleanFilesOpen] = useState(false)
  const [instanceJsonOpen, setInstanceJsonOpen] = useState(false)
  const [mromOpen, setMROMOpen] = useState(false)
  const { t } = useTranslation("games")

  return (
    <div>
      {cleanFilesOpen && (
        <CleanFilesModal onClose={() => setCleanFilesOpen(false)} />
      )}
      {instanceJsonOpen && (
        <InstanceJson onClose={() => setInstanceJsonOpen(false)} />
      )}
      {mromOpen && <MROMModal onClose={() => setMROMOpen(false)} />}
      <Controls>
        <ControlsSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("controls.search")}
        />
        <ControlsGroup
          onClear={
            filterPlatform !== "All" || filterCategory !== "All"
              ? () => {
                  setFilterPlatform("All")
                  setFilterCategory("All")
                }
              : undefined
          }
        >
          {/* By category (e.g. Handheld), like the old Games list */}
          <Suspense>
            <CategoryFilter
              value={filterCategory}
              onChange={setFilterCategory}
            />
          </Suspense>
          <Suspense>
            <PlatformFilter
              value={filterPlatform}
              onChange={setFilterPlatform}
            />
          </Suspense>
        </ControlsGroup>
        <ControlsActions>
          <CoreConditional core="NRL.MROM">
            <ControlsButton onClick={() => setMROMOpen(true)}>
              {t("controls.mrom")}
            </ControlsButton>
          </CoreConditional>
          <ControlsButton onClick={() => setCleanFilesOpen(true)}>
            {t("controls.clean_files")}
          </ControlsButton>
          <ControlsButton onClick={() => setInstanceJsonOpen(true)}>
            {t("controls.instance_json")}
          </ControlsButton>
        </ControlsActions>
      </Controls>
      <SearchContextProvider
        query={searchQuery}
        other={{ platform: filterPlatform, category: filterCategory }}
      >
        <div className="games__systems search-results">
          {systems.length === 0 && (
            <EmptyState icon="gamepad" title={t("empty_title")}>
              {t("none")}
            </EmptyState>
          )}
          {systems.map((system) => (
            <Suspense key={system.platformId} fallback={<GameSystemSkeleton />}>
              <GameSystemSection system={system} />
            </Suspense>
          ))}
          {systems.length > 0 && <NoResults />}
        </div>
      </SearchContextProvider>
    </div>
  )
}

/** Only shows one system's games. */
const CategoryFilter = ({
  value,
  onChange,
}: {
  value: string
  onChange: (category: string) => void
}) => {
  const categories = useAtomValue(gameSystemCategoriesSelector)
  const { t } = useTranslation("games")
  if (categories.length < 2) return null
  return (
    <Select
      active={value !== "All"}
      label={t("controls.category")}
      value={value}
      onChange={onChange}
      options={[
        { value: "All", label: t("controls.all") },
        ...categories.map((category) => ({ value: category })),
      ]}
    />
  )
}

const PlatformFilter = ({
  value,
  onChange,
}: {
  value: string
  onChange: (platformId: string) => void
}) => {
  const options = useAtomValue(gameSystemOptionsSelector)
  const { t } = useTranslation("games")
  return (
    <Select
      active={value !== "All"}
      label={t("controls.platform")}
      value={value}
      onChange={onChange}
      searchable={options.length > 8}
      searchPlaceholder={t("controls.search")}
      options={[
        { value: "All", label: t("controls.all") },
        ...options.map(({ platformId, name }) => ({
          value: platformId,
          label: name,
        })),
      ]}
    />
  )
}
