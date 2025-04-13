import { CoreInfoSelectorFamily } from "../../../recoil/selectors"
import { currentViewAtom } from "../../../recoil/view/atoms"
import { AuthorTag } from "../authorTag"

import "./index.css"
import { useAtomValue, useSetAtom } from "jotai"

export const CoreTag = ({
  coreName,
  onClick,
}: {
  coreName: string
  onClick?: () => void
}) => {
  const coreInfo = useAtomValue(CoreInfoSelectorFamily(coreName))
  const viewCore = useSetAtom(currentViewAtom)

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
