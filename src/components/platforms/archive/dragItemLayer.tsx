import { useAtomValue } from "jotai"
import {
  draggedPlatformsAtom,
  platformModalCursorPositonAtom,
  platformModalPositionAtom,
} from "../../../jotai/platforms/atoms"
import { PlatformImage } from "../../cores/platformImage"
import { PlatformGrid } from "./bucket"
import {
  unpositionedPlatformsSelector,
  wouldHitPlatformLimitSelector,
} from "../../../jotai/platforms/selectors"
import { WarningIcon } from "../../cores/info/requiredFiles/warningIcon"
import { Suspense } from "react"
import { useBEM } from "../../../hooks/useBEM"
import { useTranslation } from "react-i18next"

export const PlatformArchiveDragItemLayer = () => {
  const cursorPosition = useAtomValue(platformModalCursorPositonAtom)
  const draggedItem = useAtomValue(draggedPlatformsAtom)

  return (
    <div className="platform-archive__drag-item-layer">
      <Suspense>
        <LimitStatus />
      </Suspense>
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

const LimitStatus = () => {
  const activePlatforms = useAtomValue(platformModalPositionAtom)
  const wouldHit = useAtomValue(wouldHitPlatformLimitSelector)
  const { t } = useTranslation("platforms")

  const className = useBEM({
    block: "platform-archive",
    element: "limit-status",
    modifiers: {
      warning: wouldHit,
    },
  })

  return (
    <div className={className}>
      {wouldHit ? (
        <>
          <WarningIcon />
          {t("count", { count: activePlatforms.length })}
        </>
      ) : (
        <TickIcon />
      )}
    </div>
  )
}

const TickIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="#e3e3e3"
    viewBox="0 -960 960 960"
  >
    <path d="M400-304 240-464l56-56 104 104 264-264 56 56z" />
  </svg>
)
