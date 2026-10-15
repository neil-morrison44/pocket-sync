import { Children, ReactNode, useRef } from "react"
import "./index.css"
import "../ui/Skeleton/Skeleton.css"
import { OnlyLoadsWhenShown } from "../../utils/onlyLoadsWhenShown"
import { useRovingFocus } from "../../hooks/useRovingFocus"

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
  const gridRef = useRef<HTMLDivElement>(null)
  // the grid is one tab stop; arrow keys move between its items (whole-tile
  // buttons, or the open button of tiles that have their own actions)
  const rovingFocus = useRovingFocus(
    gridRef,
    ':scope > [role="button"], :scope > .tile > .tile__open:is(button)'
  )

  return (
    <div className={`grid ${className ?? ""}`} ref={gridRef} {...rovingFocus}>
      {items.map((i) => (
        <OnlyLoadsWhenShown
          className="skeleton"
          height={placeholderItemHeight}
          key={((i as any).key as string | undefined) || undefined}
        >
          {i}
        </OnlyLoadsWhenShown>
      ))}
    </div>
  )
}
