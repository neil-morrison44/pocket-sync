import React from "react"
import "./index.css"

type LoaderProps = {
  className?: string
  fullHeight?: boolean
  title?: string
}

export const Loader = ({ className, fullHeight, title = "" }: LoaderProps) => (
  <div
    className={`loader ${className || ""} ${fullHeight ? "loader--full" : ""}`}
    title={title}
  ></div>
)
