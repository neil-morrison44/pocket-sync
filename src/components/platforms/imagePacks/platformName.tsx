import { PlatformInfoSelectorFamily } from "../../../recoil/platforms/selectors"
import { PlatformId } from "../../../types"
import { useAtomValue } from "jotai"

type PlatformNameProps = {
  platformId: PlatformId
}

export const PlatformName = ({ platformId }: PlatformNameProps) => {
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(platformId))
  return <div>{platform.name}</div>
}
