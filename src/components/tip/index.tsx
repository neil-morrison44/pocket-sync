import { ReactNode } from "react"
import "./index.css"

export const Tip = ({ children }: { children: ReactNode }) => (
  <div className="tip">{children}</div>
)
