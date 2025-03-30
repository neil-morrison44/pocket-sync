import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { PlatformImageSelectorFamily } from "../../recoil/platforms/selectors"
import { PlatformId } from "../../types"

type PlatformImageProps = {
  platformId: PlatformId
  className?: string
}
export const PlatformImage = ({
  platformId,
  className,
}: PlatformImageProps) => {
  const imageSrc = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PlatformImageSelectorFamily(platformId)
  )
  return <img className={className} src={imageSrc} width="521" height="165" />
}
