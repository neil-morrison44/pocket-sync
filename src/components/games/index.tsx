import { Suspense, useState } from "react"
import { Controls, ControlsActions } from "../controls"
import { SearchContextProvider } from "../search/context"
import NoResults from "../ui/NoResults"
import { InstanceJson } from "./instanceJson"
import { CleanFilesModal } from "./cleanFiles"
import { useTranslation } from "react-i18next"
import { ControlsSearch } from "../controls/inputs/search"
import { ControlsButton } from "../controls/inputs/button"
import { useAtomValue } from "jotai"
import { CoreConditional } from "../shared/coreConditional"
import { MROMModal } from "./mrom"
import {
  gameSystemOptionsSelector,
  gameSystemsSelector,
} from "../../jotai/games/selectors"
import Select from "../ui/Select"
import { GameSystemSection, GameSystemSkeleton } from "./system"
import EmptyState from "../ui/EmptyState"
import "./index.css"

export const Games = () => {
  const systems = useAtomValue(gameSystemsSelector)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterPlatform, setFilterPlatform] = useState<string>("All")
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
        <Suspense>
          <PlatformFilter value={filterPlatform} onChange={setFilterPlatform} />
        </Suspense>
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
        other={{ platform: filterPlatform }}
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
