import { ReactNode } from "react"
import "./index.css"

type GridProps = {
  children: ReactNode
  className?: string
}

export const Grid = ({ children, className }: GridProps) => {
  return <div className={`grid ${className ?? ""}`}>{children}</div>
}
