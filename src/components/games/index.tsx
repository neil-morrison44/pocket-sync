import { Suspense, useState } from "react"
import { cateogryListselector } from "../../jotai/inventory/selectors"
import { Controls, ControlsActions } from "../controls"
import { SearchContextProvider } from "../search/context"
import { InstanceJson } from "./instanceJson"
import { CleanFilesModal } from "./cleanFiles"
import { useTranslation } from "react-i18next"
import { ControlsSearch } from "../controls/inputs/search"
import { ControlsButton } from "../controls/inputs/button"
import { ControlsSelect } from "../controls/inputs/select"
import { useAtomValue } from "jotai"
import { CoreConditional } from "../shared/coreConditional"
import { MROMModal } from "./mrom"
import { gameSystemsSelector } from "../../jotai/games/selectors"
import { GameSystemSection, GameSystemSkeleton } from "./system"
import "./index.css"

export const Games = () => {
  const systems = useAtomValue(gameSystemsSelector)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const [cleanFilesOpen, setCleanFilesOpen] = useState(false)
  const [instanceJsonOpen, setInstanceJsonOpen] = useState(false)
  const [mromOpen, setMROMOpen] = useState(false)
  const { t } = useTranslation("games")

  const categoryList = useAtomValue(cateogryListselector)

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
        <ControlsSelect
          options={categoryList}
          selected={filterCategory}
          onChange={setFilterCategory}
        >
          {t("controls.category")}
        </ControlsSelect>
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
        other={{ category: filterCategory }}
      >
        <div className="games__systems">
          {systems.length === 0 && (
            <div className="games__none">{t("none")}</div>
          )}
          {systems.map((system) => (
            <Suspense key={system.platformId} fallback={<GameSystemSkeleton />}>
              <GameSystemSection system={system} />
            </Suspense>
          ))}
        </div>
      </SearchContextProvider>
    </div>
  )
}
