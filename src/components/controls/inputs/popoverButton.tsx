import { CSSProperties, ReactNode } from "react"
import Button from "../../ui/Button"
import Popover from "../../ui/Popover"

type ControlsPopoverButtonProps = {
  children: ReactNode
  style?: CSSProperties
  renderPopoverContent: () => ReactNode
}

/** A controls-bar button that opens a panel, e.g. a filter list. */
export const ControlsPopoverButton = ({
  children,
  style,
  renderPopoverContent,
}: ControlsPopoverButtonProps) => (
  <Popover
    align="start"
    trigger={
      <Button icon="chevron-down" style={style}>
        {children}
      </Button>
    }
  >
    {renderPopoverContent()}
  </Popover>
)
