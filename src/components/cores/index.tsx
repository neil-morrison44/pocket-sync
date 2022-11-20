import { Suspense, useMemo, useState } from "react"
import { useRecoilCallback, useRecoilValue } from "recoil"
import { useCategoryLookup } from "../../hooks/useCategoryLookup"
import { useSaveScroll } from "../../hooks/useSaveScroll"
import {
  fileSystemInvalidationAtom,
  inventoryInvalidationAtom,
} from "../../recoil/atoms"
import { CateogryListselector } from "../../recoil/inventory/selectors"
import { CoreInventorySelector } from "../../recoil/inventory/selectors"
import { coresListSelector } from "../../recoil/selectors"
import { Controls } from "../controls"
import { Grid } from "../grid"
import { Loader } from "../loader"
import { Tip } from "../tip"
import { CoreInfo } from "./info"
import { CoreItem } from "./item"

export const Cores = () => {
  const [selectedCore, setSelectedCore] = useState<string | null>(null)
  const coresList = useRecoilValue(coresListSelector)
  const coreInventory = useRecoilValue(CoreInventorySelector)
  const { pushScroll, popScroll } = useSaveScroll()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const lookupCategory = useCategoryLookup()

  const refresh = useRecoilCallback(({ set }) => () => {
    set(inventoryInvalidationAtom, Date.now())
    set(fileSystemInvalidationAtom, Date.now())
  })

  const notInstalledCores = useMemo(() => {
    return coreInventory.data
      .filter(({ identifier }) => !coresList.includes(identifier))
      .filter(({ release, prerelease }) => {
        if (filterCategory === "All") return true

        if (release?.platform.category === filterCategory) return true
        if (prerelease?.platform.category === filterCategory) return true
        return false
      })
      .filter((core) =>
        core.identifier.toLowerCase().includes(searchQuery.toLowerCase())
      )
  }, [searchQuery, filterCategory, coresList, coreInventory])

  const sortedList = useMemo(
    () =>
      [...coresList]
        .sort((a, b) => {
          const [authorA, coreA] = a.split(".")
          const switchedA = `${coreA}.${authorA}`

          const [authorB, coreB] = b.split(".")
          const switchedB = `${coreB}.${authorB}`

          return switchedA.localeCompare(switchedB)
        })
        .filter((core) => {
          if (filterCategory === "All") return true
          return lookupCategory(core) === filterCategory
        })
        .filter((core) =>
          core.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    [searchQuery, filterCategory, coresList]
  )

  const categoryList = useRecoilValue(CateogryListselector)

  if (selectedCore) {
    return (
      <CoreInfo
        coreName={selectedCore}
        onBack={() => {
          setSelectedCore(null)
          popScroll()
        }}
      />
    )
  }

  return (
    <div>
      <Controls
        controls={[
          {
            type: "search",
            text: "Search",
            value: searchQuery,
            onChange: (v) => setSearchQuery(v),
          },
          {
            type: "button",
            text: "Refresh",
            onClick: refresh,
          },
          {
            type: "select",
            options: categoryList,
            selected: filterCategory,
            text: "Category",
            onChange: (v) => setFilterCategory(v),
          },
        ]}
      />
      <h2>{`Installed (${sortedList.length})`}</h2>
      <Grid>
        {sortedList.map((core) => (
          <Suspense fallback={<Loader />} key={core}>
            <CoreItem
              coreName={core}
              onClick={() => {
                pushScroll()
                setSelectedCore(core)
              }}
            />
          </Suspense>
        ))}
      </Grid>

      <h2>{`Available (${notInstalledCores.length})`}</h2>
      <Grid>
        {notInstalledCores.map(({ identifier: core, platform }) => (
          <Suspense fallback={<Loader />} key={core}>
            <div
              className="cores__item cores__item--not-installed"
              onClick={() => {
                pushScroll()
                setSelectedCore(core)
              }}
            >
              <div>{platform}</div>
              <div className="cores__not-installed-item-id">{core}</div>
            </div>
          </Suspense>
        ))}
      </Grid>

      <Tip>
        {
          "You can also install cores (or anything else in a zip) by dragging the .zip into this window"
        }
      </Tip>
    </div>
  )
}
