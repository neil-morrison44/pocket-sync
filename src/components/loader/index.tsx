import { MutableRefObject } from "react"
import "./index.css"
import { useBEM } from "../../hooks/useBEM"
import Spinner from "../ui/Spinner"
import { IconSize } from "../ui/Icon"

type LoaderProps = {
  className?: string
  fullHeight?: boolean
  grow?: boolean
  title?: string
  height?: number
  heightRef?: MutableRefObject<number>
  /** Spinner size; 20 for small spots like buttons. */
  size?: IconSize
}

export const Loader = ({
  className,
  fullHeight = false,
  grow = false,
  height,
  title = "",
  heightRef,
  size = 40,
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
    >
      <Spinner size={size} />
    </div>
  )
}
