import { useAtomValue } from "jotai"
import { coreInventoryAtom } from "../../jotai/inventory/atoms"
import { useMemo } from "react"
import { PlatformInventoryImageSelectorFamily } from "../../jotai/inventory/selectors"

export const NotInstalledCoreImage = ({ coreName }: { coreName: string }) => {
  const coreInventory = useAtomValue(coreInventoryAtom)

  const mainPlatformId = useMemo(() => {
    const foundCore = coreInventory.cores.data.find((c) => c.id === coreName)
    if (!foundCore) return ""
    return foundCore.releases[0].core.metadata.platform_ids[0]
  }, [coreName])

  const imageUrl = useAtomValue(
    PlatformInventoryImageSelectorFamily(mainPlatformId)
  )

  return (
    <img
      className="update__list-item-image"
      src={imageUrl}
      height="165"
      width="521"
    ></img>
  )
}
