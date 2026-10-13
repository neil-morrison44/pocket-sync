import { ReactNode } from "react"
import "./index.css"

type ControlProps = {
  children?: ReactNode
}

// Header bar layout: back button, search and filters on the left; actions
// (wrapped in ControlsActions) on the right.
export const Controls = ({ children }: ControlProps) => (
  <div className="controls" data-tauri-drag-region>
    {children}
  </div>
)

export const ControlsActions = ({ children }: ControlProps) => (
  <div className="controls__actions">{children}</div>
)
