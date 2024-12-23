import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import {
  CoreInfoSelectorFamily,
  CoreAuthorImageSelectorFamily,
} from "../../../recoil/selectors"

import "./index.css"

export const AuthorTag = ({ coreName }: { coreName: string }) => {
  const coreInfo = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    CoreInfoSelectorFamily(coreName)
  )
  const authorImageSrc = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    CoreAuthorImageSelectorFamily(coreName)
  )

  return (
    <div className="author-tag">
      <img src={authorImageSrc} />
      {coreInfo.core.metadata.author}
    </div>
  )
}
