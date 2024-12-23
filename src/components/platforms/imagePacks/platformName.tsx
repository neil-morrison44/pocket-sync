import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { PlatformInfoSelectorFamily } from "../../../recoil/platforms/selectors"
import { PlatformId } from "../../../types"

type PlatformNameProps = {
  platformId: PlatformId
}

export const PlatformName = ({ platformId }: PlatformNameProps) => {
  const { platform } = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PlatformInfoSelectorFamily(platformId)
  )
  return <div>{platform.name}</div>
}
