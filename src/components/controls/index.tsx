import { ReactNode } from "react"
import { ViewTransition } from "react"
import "./index.css"

type ControlProps = {
  children?: ReactNode
}

export const Controls = ({ children }: ControlProps) => (
  <ViewTransition>
    <div className="controls">{children}</div>
  </ViewTransition>
)
