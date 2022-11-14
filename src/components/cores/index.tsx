import { Suspense, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import {
  CoreInventorySelector,
  coresListSelector,
} from "../../recoil/selectors"
import { Grid } from "../grid"
import { Loader } from "../loader"
import { CoreInfo } from "./info"
import { CoreItem } from "./item"

export const Cores = () => {
  const [selectedCore, setSelectedCore] = useState<string | null>(null)
  const coresList = useRecoilValue(coresListSelector)
  const coreInventory = useRecoilValue(CoreInventorySelector)

  console.log({ coreInventory })

  const notInstalledCores = useMemo(() => {
    return coreInventory.data.filter(
      ({ identifier }) => !coresList.includes(identifier)
    )
  }, [coresList, coreInventory])

  console.log(notInstalledCores)

  const sortedList = useMemo(
    () =>
      [...coresList].sort((a, b) => {
        const [authorA, coreA] = a.split(".")
        const switchedA = `${coreA}.${authorA}`

        const [authorB, coreB] = b.split(".")
        const switchedB = `${coreB}.${authorB}`

        return switchedA.localeCompare(switchedB)
      }),
    [coresList]
  )

  if (selectedCore) {
    return (
      <CoreInfo coreName={selectedCore} onBack={() => setSelectedCore(null)} />
    )
  }

  return (
    <div>
      <h2>{`Installed (${coresList.length})`}</h2>
      <Grid>
        {sortedList.map((core) => (
          <Suspense fallback={<Loader />} key={core}>
            <CoreItem coreName={core} onClick={() => setSelectedCore(core)} />
          </Suspense>
        ))}
      </Grid>

      <h2>{`Available (${notInstalledCores.length})`}</h2>
      <Grid>
        {notInstalledCores.map(({ identifier: core }) => (
          <Suspense fallback={<Loader />} key={core}>
            <div>{core}</div>
          </Suspense>
        ))}
      </Grid>
    </div>
  )
}
