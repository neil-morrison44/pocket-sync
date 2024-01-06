import { ReactNode } from "react"

type SupportsBubbleProps = {
  children: ReactNode
  supports: boolean
  onClick?: () => void
}

export const SupportsBubble = ({
  supports,
  children,
  onClick,
}: SupportsBubbleProps) => (
  <div
    className={`core-info__supports core-info__supports--${supports} ${
      onClick ? "core-info__supports--button" : ""
    }`}
    onClick={onClick}
  >
    {children}
  </div>
)
