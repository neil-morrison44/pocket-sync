import { useRecoilValue, useSetRecoilState } from "recoil"
import { CoreInfoSelectorFamily } from "../../../recoil/selectors"
import { currentViewAtom } from "../../../recoil/view/atoms"
import { AuthorTag } from "../authorTag"

import "./index.css"

export const CoreTag = ({ coreName }: { coreName: string }) => {
  const coreInfo = useRecoilValue(CoreInfoSelectorFamily(coreName))
  const viewCore = useSetRecoilState(currentViewAtom)

  return (
    <div
      className="core-tag"
      onClick={() => viewCore({ view: "Cores", selected: coreName })}
    >
      <AuthorTag coreName={coreName} />
      <b>{`${coreInfo.core.metadata.shortname}`}</b>
    </div>
  )
}
