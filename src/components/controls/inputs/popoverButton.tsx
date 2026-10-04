import { CSSProperties, ReactNode, useId, useState } from "react"

type ControlsPopoverButtonProps = {
  children: ReactNode
  style?: CSSProperties
  renderPopoverContent: () => ReactNode
}

export const ControlsPopoverButton = ({
  children,
  style,
  renderPopoverContent,
}: ControlsPopoverButtonProps) => {
  const popoverId = useId()
  const anchorName = `--anchor-${popoverId.replace(/:/g, "")}`

  return (
    <>
      <button
        type="button"
        className="controls__popover-button"
        popoverTarget={popoverId}
        popoverTargetAction="toggle"
        style={
          {
            ...style,
            anchorName: anchorName,
          } as React.CSSProperties
        }
      >
        {children}
      </button>
      <div
        id={popoverId}
        className="controls__popover-content"
        popover="auto"
        style={
          {
            positionAnchor: anchorName,
          } as React.CSSProperties
        }
      >
        {renderPopoverContent()}
      </div>
    </>
  )
}
