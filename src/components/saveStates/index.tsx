import { Fragment, Suspense, useCallback, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { AllSaveStatesSelector } from "../../recoil/saveStates/selectors"
import { SaveStateItem } from "./item"
import { Loader } from "../loader"

import "./index.css"
import { Controls } from "../controls"
import { SearchContextProvider } from "../search/context"
import { confirm } from "@tauri-apps/plugin-dialog"
import { invokeDeleteFiles } from "../../utils/invokes"
import { splitAsPath } from "../../utils/splitAsPath"
import { CoreTag } from "../shared/coreTag"
import { useTranslation } from "react-i18next"
import { PhotoExportModal } from "./photoExportModal"
import { ControlsSearch } from "../controls/inputs/search"
import { ControlsButton } from "../controls/inputs/button"

export const SaveStates = () => {
  const allSaveStates = useRecoilValue(AllSaveStatesSelector)
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useTranslation("save_states")

  const [isExportingPhotos, setIsExportingPhotos] = useState<string | null>(
    null
  )

  const groupByCore = useMemo(
    () =>
      allSaveStates.reduce((g, p) => {
        const pathSplit = splitAsPath(p)
        const coreName = pathSplit.length > 1 ? pathSplit[0] : "Native"

        const existing = g[coreName]
        if (existing) {
          existing.push(p)
        } else {
          g[coreName] = [p]
        }

        return g
      }, {} as { [k: string]: string[] }),
    [allSaveStates]
  )

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

  return (
    <div className="save-states">
      <Controls>
        <ControlsSearch
          placeholder={t("controls.search")}
          value={searchQuery}
          onChange={setSearchQuery}
        />
        {selectedStates.length !== 0 && (
          <>
            <ControlsButton onClick={() => setSelectedStates([])}>
              {t("controls.clear_selection")}
            </ControlsButton>
            <ControlsButton onClick={deleteSelected}>
              {t("controls.delete_selection", {
                count: selectedStates.length,
              })}
            </ControlsButton>
          </>
        )}
      </Controls>

      {isExportingPhotos && (
        <PhotoExportModal
          path={isExportingPhotos}
          onClose={() => setIsExportingPhotos(null)}
        />
      )}

      <div className="save-states__list">
        <SearchContextProvider query={searchQuery}>
          {Object.entries(groupByCore).map(([coreName, saveStates], index) => (
            <Fragment key={coreName}>
              <div className="save-states__items">
                {saveStates.map((p) => (
                  <Suspense
                    fallback={<Loader className="save-states__item" />}
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
              {coreName === "Native" && (
                <CartridgeHeader
                  count={saveStates.length}
                  zIndex={Object.values(groupByCore).length - index}
                />
              )}
              {coreName !== "Native" && (
                <Suspense fallback={<Loader />}>
                  <CoreNameHeader
                    coreName={coreName}
                    count={saveStates.length}
                    zIndex={Object.values(groupByCore).length - index}
                  />
                </Suspense>
              )}
            </Fragment>
          ))}
        </SearchContextProvider>
      </div>
    </div>
  )
}

const CartridgeHeader = ({
  count,
  zIndex,
}: {
  count: number
  zIndex: number
}) => {
  const { t } = useTranslation("save_states")
  return (
    <div className="save-states__core-header" style={{ zIndex }}>
      <b>{t("cartridge")}</b>
      <div className="save-states__core-header-count">
        {t("count", { count })}
      </div>
    </div>
  )
}

const CoreNameHeader = ({
  coreName,
  count,
  zIndex,
}: {
  coreName: string
  count: number
  zIndex: number
}) => {
  const { t } = useTranslation("save_states")
  return (
    <div className="save-states__core-header" style={{ zIndex }}>
      <CoreTag coreName={coreName} />
      <div className="save-states__core-header-count">
        {t("count", { count })}
      </div>
    </div>
  )
}
