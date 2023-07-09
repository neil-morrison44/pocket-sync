import { useRecoilValue } from "recoil"
import { CoreInfoSelectorFamily } from "../../../recoil/selectors"

import "./index.css"
import { useUpdateAvailable } from "../../../hooks/useUpdateAvailable"

type VersionProps = {
  coreName: string
}

export const Version = ({ coreName }: VersionProps) => {
  const coreInfo = useRecoilValue(CoreInfoSelectorFamily(coreName))
  const updateAvailable = useUpdateAvailable(coreName)

  return (
    <div className="version">
      {coreInfo.core.metadata.version}
      {updateAvailable && (
        <div className="version__update">{updateAvailable}</div>
      )}
    </div>
  )
}
