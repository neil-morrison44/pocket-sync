import { ReactNode } from "react"
import clsx from "clsx"
import Icon from "../ui/Icon"
import "./index.css"

type TipProps = {
  children: ReactNode
  /** A warning instead of a hint: warning icon and colour. */
  warning?: boolean
}

/** A short hint line in soft text with an info icon, e.g. under a list. */
export const Tip = ({ children, warning = false }: TipProps) => (
  <div className={clsx("tip", warning && "tip--warning")}>
    {/* 16px, like icons in buttons next to their text */}
    <Icon icon={warning ? "warning-diamond" : "info"} size={16} />
    <span>{children}</span>
  </div>
)
