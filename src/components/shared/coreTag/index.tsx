import {
  useRecoilValue_TRANSITION_SUPPORT_UNSTABLE,
  useSetRecoilState,
} from "recoil"
import { CoreInfoSelectorFamily } from "../../../recoil/selectors"
import { currentViewAtom } from "../../../recoil/view/atoms"
import { AuthorTag } from "../authorTag"

import "./index.css"

export const CoreTag = ({
  coreName,
  onClick,
}: {
  coreName: string
  onClick?: () => void
}) => {
  const coreInfo = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    CoreInfoSelectorFamily(coreName)
  )
  const viewCore = useSetRecoilState(currentViewAtom)

  return (
    <div
      className="core-tag"
      onClick={() =>
        onClick ? onClick() : viewCore({ view: "Cores", selected: coreName })
      }
    >
      <AuthorTag coreName={coreName} />
      <b>{coreInfo.core.metadata.shortname}</b>
    </div>
  )
}
