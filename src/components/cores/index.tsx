import { Suspense, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { useSaveScroll } from "../../hooks/useSaveScroll"
import {
  CoreInventorySelector,
  coresListSelector,
} from "../../recoil/selectors"
import { Controls } from "../controls"
import { Grid } from "../grid"
import { Loader } from "../loader"
import { CoreInfo } from "./info"
import { InstalledCoreInfo } from "./info/installed"
import { CoreItem } from "./item"

export const Cores = () => {
  const [selectedCore, setSelectedCore] = useState<string | null>(null)
  const coresList = useRecoilValue(coresListSelector)
  const coreInventory = useRecoilValue(CoreInventorySelector)
  const { pushScroll, popScroll } = useSaveScroll()

  const [searchQuery, setSearchQuery] = useState<string>("")

  const notInstalledCores = useMemo(() => {
    return coreInventory.data
      .filter(({ identifier }) => !coresList.includes(identifier))
      .filter((core) =>
        core.identifier.toLowerCase().includes(searchQuery.toLowerCase())
      )
  }, [searchQuery, coresList, coreInventory])

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
        .filter((core) =>
          core.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    [searchQuery, coresList]
  )

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
            type: "select",
            options: ["Arcade"],
            selected: "Arcade",
            text: "Category",
            onChange: (v) => console.log(v),
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
    </div>
  )
}
