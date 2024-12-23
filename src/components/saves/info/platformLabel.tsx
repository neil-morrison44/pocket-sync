import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { PlatformInfoSelectorFamily } from "../../../recoil/platforms/selectors"
import { PlatformId } from "../../../types"

export const PlatformLabel = ({ id }: { id: PlatformId }) => {
  const { platform } = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(
    PlatformInfoSelectorFamily(id)
  )
  return <div className="saves__info-save-files-platform">{platform.name}</div>
}
