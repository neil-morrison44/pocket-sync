import { Children, ReactNode } from "react"
import "./index.css"
import { OnlyLoadsWhenShown } from "../../utils/onlyLoadsWhenShown"

type GridProps = {
  children: ReactNode
  className?: string
  placeholderItemHeight?: number
}

export const Grid = ({
  children,
  className,
  placeholderItemHeight = 200,
}: GridProps) => {
  const items = Children.toArray(children)

  return (
    <div className={`grid ${className ?? ""}`}>
      {Children.toArray(
        items.map((i) => (
          <OnlyLoadsWhenShown height={placeholderItemHeight}>
            {i}
          </OnlyLoadsWhenShown>
        ))
      )}
    </div>
  )
}
