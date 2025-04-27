import {
  CoreInfoSelectorFamily,
  CoreAuthorImageSelectorFamily,
} from "../../../recoil/selectors"

import "./index.css"
import { useAtomValue } from "jotai"

export const AuthorTag = ({ coreName }: { coreName: string }) => {
  const coreInfo = useAtomValue(CoreInfoSelectorFamily(coreName))
  const authorImageSrc = useAtomValue(CoreAuthorImageSelectorFamily(coreName))

  return (
    <div className="author-tag">
      <img src={authorImageSrc} />
      {coreInfo.core.metadata.author}
    </div>
  )
}
