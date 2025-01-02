import { MutableRefObject } from "react"
import "./index.css"
import { useBEM } from "../../hooks/useBEM"

type LoaderProps = {
  className?: string
  fullHeight?: boolean
  grow?: boolean
  title?: string
  height?: number
  heightRef?: MutableRefObject<number>
}

export const Loader = ({
  className,
  fullHeight = false,
  grow = false,
  height,
  title = "",
  heightRef,
}: LoaderProps) => {
  const heightValue = heightRef ? heightRef.current : height
  const heightPx = heightValue ? `${heightValue}px` : undefined

  const loaderClassName = useBEM({
    block: "loader",
    modifiers: {
      full: fullHeight,
      grow,
    },
  })

  return (
    <div
      className={`${loaderClassName} ${className || ""}`}
      title={title}
      style={{ height: heightPx }}
    ></div>
  )
}
