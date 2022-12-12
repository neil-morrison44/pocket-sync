import { useRecoilValue } from "recoil"
import {
  CoreInfoSelectorFamily,
  CoreAuthorImageSelectorFamily,
} from "../../../recoil/selectors"

export const AuthorTag = ({ coreName }: { coreName: string }) => {
  const coreInfo = useRecoilValue(CoreInfoSelectorFamily(coreName))
  const authorImageSrc = useRecoilValue(CoreAuthorImageSelectorFamily(coreName))

  return (
    <div className="core-info__author-tag">
      <img src={authorImageSrc} />
      {coreInfo.core.metadata.author}
    </div>
  )
}
