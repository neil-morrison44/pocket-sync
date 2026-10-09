import { useAtomValue } from "jotai"
import { coreInventoryAtom } from "../../jotai/inventory/atoms"
import { useMemo } from "react"
import { PlatformInventoryImageSelectorFamily } from "../../jotai/inventory/selectors"
import { CoreMainPlatformIdSelectorFamily } from "../../jotai/selectors"
import { PlatformImage } from "../cores/platformImage"

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

export const formatDownloadTime = (seconds: number) => {
  if (seconds === 0 || !isFinite(seconds)) return ""
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export const InstalledCoreImage = ({ coreName }: { coreName: string }) => {
  const mainPlatformId = useAtomValue(
    CoreMainPlatformIdSelectorFamily(coreName)
  )

  return (
    <PlatformImage
      className="update__list-item-image"
      platformId={mainPlatformId}
    />
  )
}
