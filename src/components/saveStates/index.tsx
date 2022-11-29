import { Suspense } from "react"
import { useRecoilValue } from "recoil"
import { AllSaveStatesSelector } from "../../recoil/saveStates/selectors"
import { SaveStateItem } from "./item"
import { Loader } from "../loader"

export const SaveStates = () => {
  const allSaveStates = useRecoilValue(AllSaveStatesSelector)

  return (
    <div>
      {"Save States"}

      <div>
        {allSaveStates.map((p) => (
          <Suspense fallback={<Loader />} key={p}>
            <SaveStateItem path={p} />
          </Suspense>
        ))}
      </div>
    </div>
  )
}
