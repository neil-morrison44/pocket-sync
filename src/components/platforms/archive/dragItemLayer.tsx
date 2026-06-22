import { useAtomValue } from "jotai"
import {
  draggedPlatformsAtom,
  platformModalCursorPositonAtom,
  platformModalPositionAtom,
} from "../../../recoil/platforms/atoms"
import { PlatformImage } from "../../cores/platformImage"
import { PlatformGrid } from "./bucket"

export const PlatformArchiveDragItemLayer = () => {
  const positionedItems = useAtomValue(platformModalPositionAtom)
  const cursorPosition = useAtomValue(platformModalCursorPositonAtom)
  const draggedItem = useAtomValue(draggedPlatformsAtom)

  return (
    <div className="platform-archive__drag-item-layer">
      <div className="platform-archive__count">{`${positionedItems.length} / 239`}</div>
      {draggedItem?.type === "platform" && (
        <div
          style={{
            position: "absolute",
            left: cursorPosition[0],
            top: cursorPosition[1],
          }}
        >
          <PlatformImage
            className="platform-archive__drag-image"
            platformId={draggedItem.id}
          />
        </div>
      )}

      {draggedItem?.type === "platform" && (
        <div
          style={{
            position: "absolute",
            left: cursorPosition[0],
            top: cursorPosition[1],
          }}
        >
          <PlatformImage
            className="platform-archive__drag-image"
            platformId={draggedItem.id}
          />
        </div>
      )}
      {draggedItem?.type === "group" && (
        <div
          style={{
            position: "absolute",
            left: cursorPosition[0],
            top: cursorPosition[1],
            transform: "translate(-50%, -50%)",
          }}
        >
          <PlatformGrid platforms={draggedItem.platforms} />
        </div>
      )}
    </div>
  )
}
