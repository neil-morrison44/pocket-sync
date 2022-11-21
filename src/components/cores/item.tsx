import { useRecoilValue } from "recoil"
import {
  CoreAuthorImageSelectorFamily,
  CoreInfoSelectorFamily,
} from "../../recoil/selectors"
import { PlatformImage } from "./platformImage"

import "./index.css"
import { Version } from "./version"

type CoreItemProps = {
  coreName: string
  onClick: () => void
}

export const CoreItem = ({ coreName, onClick }: CoreItemProps) => {
  const coreInfo = useRecoilValue(CoreInfoSelectorFamily(coreName))
  const imageSrc = useRecoilValue(CoreAuthorImageSelectorFamily(coreName))

  return (
    <div className="cores__item" role="button" onClick={onClick}>
      {coreInfo.core.metadata.platform_ids.map((platformId) => (
        <PlatformImage
          className="cores__platform-image"
          platformId={platformId}
          key={platformId}
        />
      ))}

      <div className="cores__info-blurb">
        <div className="cores__info-blurb-name">
          {coreInfo.core.metadata.shortname}
        </div>

        <Version coreName={coreName} />

        <div className="cores__author-tag">
          <img className="cores__author-tag-image" src={imageSrc} />
          {coreInfo.core.metadata.author}
        </div>
      </div>
    </div>
  )
}
