import { useRecoilValue } from "recoil"
import { PlatformImageSelectorFamily } from "../../recoil/selectors"
import { PlatformId } from "../../types"

type PlatformImageProps = {
  platformId: PlatformId
  className?: string
}
export const PlatformImage = ({
  platformId,
  className,
}: PlatformImageProps) => {
  const imageSrc = useRecoilValue(PlatformImageSelectorFamily(platformId))
  return <img className={className} src={imageSrc} />
}
