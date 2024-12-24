import { ReactNode } from "react"
import "./index.css"
import { useBEM } from "../../hooks/useBEM"

type TipProps = {
  children: ReactNode
  warning?: boolean
}

export const Tip = ({ children, warning = false }: TipProps) => {
  const className = useBEM({
    block: "tip",
    modifiers: {
      warning: warning,
    },
  })

  return <div className={className}>{children}</div>
}
