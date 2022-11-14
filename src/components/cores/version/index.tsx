import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import {
  CoreInfoSelectorFamily,
  CoreInventorySelector,
} from "../../../recoil/selectors"

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

    const { tag_name } = inventoryCore.release
    const metadataVersion = coreInfo.core.metadata.version

    if (tag_name !== metadataVersion) {
      if (tag_name.includes(metadataVersion)) {
        return null
      }
      return inventoryCore.release.tag_name
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
