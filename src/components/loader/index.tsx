import { MutableRefObject } from "react"
import "./index.css"

type LoaderProps = {
  className?: string
  fullHeight?: boolean
  title?: string
  height?: number
  heightRef?: MutableRefObject<number>
}

export const Loader = ({
  className,
  fullHeight,
  height,
  title = "",
  heightRef,
}: LoaderProps) => {
  const heightValue = heightRef ? heightRef.current : height
  const heightPx = heightValue ? `${heightValue}px` : undefined

  return (
    <div
      className={`loader ${className || ""} ${
        fullHeight ? "loader--full" : ""
      }`}
      title={title}
      style={{ height: heightPx }}
    ></div>
  )
}
