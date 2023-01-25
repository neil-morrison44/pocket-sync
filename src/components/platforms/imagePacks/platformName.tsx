import { useRecoilValue } from "recoil"
import { PlatformInfoSelectorFamily } from "../../../recoil/platforms/selectors"
import { PlatformId } from "../../../types"

type PlatformNameProps = {
  platformId: PlatformId
}

export const PlatformName = ({ platformId }: PlatformNameProps) => {
  const { platform } = useRecoilValue(PlatformInfoSelectorFamily(platformId))
  return <div>{platform.name}</div>
}
