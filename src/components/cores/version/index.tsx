import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { CoreInfoSelectorFamily } from "../../../recoil/selectors"
import { CoreInventorySelector } from "../../../recoil/inventory/selectors"

import "./index.css"

type VersionProps = {
  coreName: string
}

export const Version = ({ coreName }: VersionProps) => {
  const coreInfo = useRecoilValue(CoreInfoSelectorFamily(coreName))
  const coreInventory = useRecoilValue(CoreInventorySelector)

  const updateAvailable = useMemo<string | null>(() => {
    // this isn't very good yet
    const inventoryCore = coreInventory.data.find(
      ({ identifier }) => identifier === coreName
    )

    if (!inventoryCore?.release) return null

    const { version } = inventoryCore.release
    const metadataVersion = coreInfo.core.metadata.version

    if (version !== metadataVersion) {
      if (version.includes(metadataVersion)) {
        return null
      }
      return inventoryCore.release.version
    }

    return null
  }, [coreInfo.core.metadata.version, coreInventory])

  return (
    <div className="version">
      {coreInfo.core.metadata.version}
      {updateAvailable && (
        <div className="version__update">{updateAvailable}</div>
      )}
    </div>
  )
}
