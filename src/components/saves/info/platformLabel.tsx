import { PlatformInfoSelectorFamily } from "../../../recoil/platforms/selectors"
import { PlatformId } from "../../../types"
import { useAtomValue } from "jotai"

export const PlatformLabel = ({ id }: { id: PlatformId }) => {
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(id))
  return <div className="saves__info-save-files-platform">{platform.name}</div>
}
