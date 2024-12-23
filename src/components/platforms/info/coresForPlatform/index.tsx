import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { CoresForPlatformSelectorFamily } from "../../../../recoil/platforms/selectors"
import { PlatformId } from "../../../../types"
import { CoreTag } from "../../../shared/coreTag"

export const CoresForPlatform = ({
  platformId,
}: {
  platformId: PlatformId
}) => {
  const cores = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    CoresForPlatformSelectorFamily(platformId)
  )
  return (
    <div className="platform-info__cores-list">
      {cores.map((coreName) => (
        <CoreTag coreName={coreName} key={coreName} />
      ))}
    </div>
  )
}
