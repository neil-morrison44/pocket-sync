import { useRecoilValue } from "recoil"
import {
  CoreInfoSelectorFamily,
  CoreAuthorImageSelectorFamily,
} from "../../../recoil/selectors"

import "./index.css"

export const AuthorTag = ({ coreName }: { coreName: string }) => {
  const coreInfo = useRecoilValue(CoreInfoSelectorFamily(coreName))
  const authorImageSrc = useRecoilValue(CoreAuthorImageSelectorFamily(coreName))

  return (
    <div className="author-tag">
      <img src={authorImageSrc} />
      {coreInfo.core.metadata.author}
    </div>
  )
}
