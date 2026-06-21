import { useAtomValue } from "jotai"
import {
  draggedPlatformIdAtom,
  platformModalCursorPositonAtom,
  platformModalPositionAtom,
} from "../../../recoil/platforms/atoms"
import { PlatformImage } from "../../cores/platformImage"

export const PlatformLoadoutDragItemLayer = () => {
  const positionedItems = useAtomValue(platformModalPositionAtom)
  const cursorPosition = useAtomValue(platformModalCursorPositonAtom)
  const platformId = useAtomValue(draggedPlatformIdAtom)

  return (
    <div className="platform-loadout__drag-item-layer">
      <div className="platform-loadout__count">{`${positionedItems.length} / 239`}</div>
      {platformId && (
        <div
          style={{
            position: "absolute",
            left: cursorPosition[0],
            top: cursorPosition[1],
          }}
        >
          <PlatformImage
            className="platform-loadout__drag-image"
            platformId={platformId}
          />
        </div>
      )}
    </div>
  )
}
