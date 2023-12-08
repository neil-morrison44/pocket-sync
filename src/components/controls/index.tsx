import { ReactNode } from "react"
import "./index.css"

type ControlProps = {
  children?: ReactNode
}

export const Controls = ({ children }: ControlProps) => (
  <div className="controls">{children}</div>
)
