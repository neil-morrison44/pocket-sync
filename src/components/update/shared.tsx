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

export type CoreDownloadType = "Update" | "Install"

export type PhaseThreeArgs = {
  core_name: string
  file_name: string
  file_bytes: number
  download_progress: number
  file_index: number
  file_index_for_core: number
  total_file_count: number
  total_file_count_for_core: number
  elapsed_time: number
  downloaded_bytes: number
  remaining_bytes: number
}

export type UpdateEvent =
  | { type: "PhaseZeroStartedEvent" }
  | { type: "PhaseOneStartedEvent" }
  | {
      type: "PhaseOneCoreDownloadProgressEvent"
      core_name: string
      download_progress: number
      core_index: number
      total_core_count: number
      download_type: CoreDownloadType
    }
  | { type: "PhaseOneErrorEvent"; error: string }
  | { type: "PhaseTwoStartedEvent" }
  | {
      type: "PhaseTwoProgressEvent"
      processed_cores: number
      total_cores: number
    }
  | { type: "PhaseThreeStartedEvent" }
  | ({
      type: "PhaseThreeDownloadProgressEvent"
    } & PhaseThreeArgs)
  | { type: "PhaseThreeErrorEvent"; error: string }
  | {
      type: "Finish"
      updated_cores: string[]
      installed_cores: string[]
      downloaded_files_per_core: Record<string, string[]>
      total_time: number
    }
