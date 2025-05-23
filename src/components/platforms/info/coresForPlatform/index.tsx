import { CoresForPlatformSelectorFamily } from "../../../../recoil/platforms/selectors"
import { PlatformId } from "../../../../types"
import { CoreTag } from "../../../shared/coreTag"
import { useAtomValue } from "jotai"

export const CoresForPlatform = ({
  platformId,
}: {
  platformId: PlatformId
}) => {
  const cores = useAtomValue(CoresForPlatformSelectorFamily(platformId))
  return (
    <div className="platform-info__cores-list">
      {cores.map((coreName) => (
        <CoreTag coreName={coreName} key={coreName} />
      ))}
    </div>
  )
}
