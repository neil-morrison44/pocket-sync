import React from "react"
import "./index.css"

type LoaderProps = {
  className?: string
  fullHeight?: boolean
  title?: string
  height?: number
}

export const Loader = ({
  className,
  fullHeight,
  height,
  title = "",
}: LoaderProps) => (
  <div
    className={`loader ${className || ""} ${fullHeight ? "loader--full" : ""}`}
    title={title}
    style={{ height: height ? `${height}px` : undefined }}
  ></div>
)
