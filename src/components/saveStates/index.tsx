import { Fragment, Suspense, useCallback, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { AllSaveStatesSelector } from "../../recoil/saveStates/selectors"
import { SaveStateItem } from "./item"
import { Loader } from "../loader"

import "./index.css"
import { Controls } from "../controls"
import { SearchContextProvider } from "../search/context"
import { confirm } from "@tauri-apps/api/dialog"
import { invokeDeleteFiles } from "../../utils/invokes"
import { useInvalidateFileSystem } from "../../hooks/invalidation"
import { splitAsPath } from "../../utils/splitAsPath"
import { CoreTag } from "../shared/coreTag"
import { useTranslation } from "react-i18next"

export const SaveStates = () => {
  const invalidateFS = useInvalidateFileSystem()
  const allSaveStates = useRecoilValue(AllSaveStatesSelector)
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useTranslation("save_states")

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
    const plural = selectedStates.length > 1
    const okToDelete = await confirm(
      t("confirm_delete", { count: selectedStates.length })
    )
    if (!okToDelete) return

    await invokeDeleteFiles(
      selectedStates.map((s) => `Memories/Save States/${s}`)
    )
    setSelectedStates([])
    invalidateFS()
  }, [selectedStates, setSelectedStates])

  return (
    <div className="save-states">
      <Controls
        controls={[
          {
            type: "search",
            text: t("controls.search"),
            value: searchQuery,
            onChange: (v) => setSearchQuery(v),
          },
          selectedStates.length === 0
            ? undefined
            : {
                type: "button",
                text: t("controls.clear_selection"),
                onClick: () => setSelectedStates([]),
              },
          selectedStates.length === 0
            ? undefined
            : {
                type: "button",
                text: t("controls.delete_selection", {
                  count: selectedStates.length,
                }),
                onClick: deleteSelected,
              },
        ]}
      />
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
      <div className="save-states__core-header-count">{`( ${count} / 128 )`}</div>
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
  return (
    <div className="save-states__core-header" style={{ zIndex }}>
      <CoreTag coreName={coreName} />
      <div className="save-states__core-header-count">{`( ${count} / 128 )`}</div>
    </div>
  )
}
