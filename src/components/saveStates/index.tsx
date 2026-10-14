import { Suspense, useCallback, useMemo, useState } from "react"

import {
  AllSaveStatesSelector,
  saveStatePlatformsSelector,
} from "../../jotai/saveStates/selectors"
import Select from "../ui/Select"
import EmptyState from "../ui/EmptyState"
import ButtonCombo from "../ui/ButtonCombo"
import { SaveStateItem } from "./item"
import { Loader } from "../loader"

import "./index.css"
import { Controls, ControlsActions } from "../controls"
import { SearchContextProvider } from "../search/context"
import { confirm } from "@tauri-apps/plugin-dialog"
import { invokeDeleteFiles } from "../../utils/invokes"
import { splitAsPath } from "../../utils/splitAsPath"
import { CoreTag } from "../shared/coreTag"
import { useTranslation } from "react-i18next"
import { PhotoExportModal } from "./photoExportModal"
import { ControlsSearch } from "../controls/inputs/search"
import { ControlsButton } from "../controls/inputs/button"
import { useAtomValue } from "jotai"

/** The group key for save states made with a cartridge, not a core. */
const CARTRIDGE = "Native"

export const SaveStates = () => {
  const allSaveStates = useAtomValue(AllSaveStatesSelector)
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [coreFilter, setCoreFilter] = useState("All")
  const [platformFilter, setPlatformFilter] = useState("All")
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
    () => ({ platform: platformFilter }),
    [platformFilter]
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
          label={t("controls.core")}
          value={coreFilter}
          onChange={setCoreFilter}
          options={[
            { value: "All", label: t("controls.all") },
            ...groups.map(([coreName]) => ({
              value: coreName,
              label:
                coreName === CARTRIDGE
                  ? t("cartridge")
                  : (coreName.split(".")[1] ?? coreName),
            })),
          ]}
        />
        <Suspense>
          <PlatformFilter value={platformFilter} onChange={setPlatformFilter} />
        </Suspense>
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
          <ButtonCombo keys={["analogue", "up"]} size={40} />
          {t("empty.text")}
        </EmptyState>
      )}

      <SearchContextProvider query={searchQuery} other={searchFilters}>
        {groups
          .filter(
            ([coreName]) => coreFilter === "All" || coreName === coreFilter
          )
          .map(([coreName, saveStates]) => (
            <section className="save-states__group" key={coreName}>
              {coreName === CARTRIDGE ? (
                <CartridgeHeader count={saveStates.length} />
              ) : (
                <Suspense fallback={<div className="save-states__header" />}>
                  <CoreNameHeader
                    coreName={coreName}
                    count={saveStates.length}
                  />
                </Suspense>
              )}
              <div className="save-states__items">
                {saveStates.map((p) => (
                  <Suspense
                    fallback={
                      <Loader className="save-states__item" size={20} />
                    }
                    key={p}
                  >
                    <SaveStateItem
                      path={p}
                      selected={selectedStates.includes(p)}
                      onClick={() =>
                        setSelectedStates((s) => {
                          if (s.includes(p)) return s.filter((os) => os !== p)
                          return [...s, p]
                        })
                      }
                      onExportPhotos={() => setIsExportingPhotos(p)}
                    />
                  </Suspense>
                ))}
              </div>
            </section>
          ))}
      </SearchContextProvider>
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

const CartridgeHeader = ({ count }: { count: number }) => {
  const { t } = useTranslation("save_states")
  return (
    <header className="save-states__header">
      <b>{t("cartridge")}</b>
      <div className="save-states__header-count">{t("count", { count })}</div>
    </header>
  )
}

const CoreNameHeader = ({
  coreName,
  count,
}: {
  coreName: string
  count: number
}) => {
  const { t } = useTranslation("save_states")
  return (
    <header className="save-states__header">
      <CoreTag coreName={coreName} />
      <div className="save-states__header-count">{t("count", { count })}</div>
    </header>
  )
}
