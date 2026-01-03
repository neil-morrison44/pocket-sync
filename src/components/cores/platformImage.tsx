import { PlatformImageSelectorFamily } from "../../recoil/platforms/selectors"
import { PlatformId } from "../../types"
import { useAtomValue } from "jotai"
import { ViewTransition } from "react"

type PlatformImageProps = {
  platformId: PlatformId
  className?: string
}
export const PlatformImage = ({
  platformId,
  className,
}: PlatformImageProps) => {
  const imageSrc = useAtomValue(PlatformImageSelectorFamily(platformId))

  return (
    <ViewTransition name={platformId}>
      <img className={className} src={imageSrc} width="521" height="165" />
    </ViewTransition>
  )
}
