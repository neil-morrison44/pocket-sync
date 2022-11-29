import { Fragment, Suspense, useCallback, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { AllSaveStatesSelector } from "../../recoil/saveStates/selectors"
import { SaveStateItem } from "./item"
import { Loader } from "../loader"

import "./index.css"
import { CoreInfoSelectorFamily } from "../../recoil/selectors"
import { Controls } from "../controls"
import { SearchContextProvider } from "../search/context"
import { confirm } from "@tauri-apps/api/dialog"
import { invokeDeleteFiles } from "../../utils/invokes"
import { useInvalidateFileSystem } from "../../hooks/invalidation"

export const SaveStates = () => {
  const invalidateFS = useInvalidateFileSystem()
  const allSaveStates = useRecoilValue(AllSaveStatesSelector)
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const groupByCore = useMemo(
    () =>
      allSaveStates.reduce((g, p) => {
        const coreName = p.substring(0, p.indexOf("/"))

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
      `Are you sure you want to delete ${selectedStates.length} save state${
        plural ? "s" : ""
      }?`
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
            text: "Search",
            value: searchQuery,
            onChange: (v) => setSearchQuery(v),
          },
          selectedStates.length === 0
            ? undefined
            : {
                type: "button",
                text: `Clear Selection (${selectedStates.length})`,
                onClick: () => setSelectedStates([]),
              },
          selectedStates.length === 0
            ? undefined
            : {
                type: "button",
                text: `Delete Selected (${selectedStates.length})`,
                onClick: deleteSelected,
              },
        ]}
      />
      <div>
        <SearchContextProvider query={searchQuery}>
          {Object.entries(groupByCore).map(([coreName, saveStates]) => (
            <Fragment key={coreName}>
              <CoreNameHeader coreName={coreName} count={saveStates.length} />
              <div className="save-states__items">
                {saveStates.map((p) => (
                  <Suspense fallback={<Loader />} key={p}>
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
            </Fragment>
          ))}
        </SearchContextProvider>
      </div>
    </div>
  )
}

const CoreNameHeader = ({
  coreName,
  count,
}: {
  coreName: string
  count: number
}) => {
  const coreInfo = useRecoilValue(CoreInfoSelectorFamily(coreName))

  return (
    <div className="save-states__core-header">
      {`${coreInfo.core.metadata.shortname}`}

      <div className="save-states__core-header-count">{`( ${count} / 128 )`}</div>
    </div>
  )
}
