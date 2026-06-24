import { CSSProperties } from "react"
import { PlatformImageSelectorFamily } from "../../recoil/platforms/selectors"
import { PlatformId } from "../../types"
import { useAtomValue } from "jotai"

type PlatformImageProps = {
  platformId: PlatformId
  className?: string
  style?: CSSProperties
}
export const PlatformImage = ({
  platformId,
  className,
  style,
}: PlatformImageProps) => {
  const imageSrc = useAtomValue(PlatformImageSelectorFamily(platformId))
  return (
    <img
      className={className}
      src={imageSrc}
      style={style}
      width="521"
      height="165"
    />
  )
}
