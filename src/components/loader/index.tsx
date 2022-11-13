import React from "react"
import "./index.css"

type LoaderProps = {
  className?: string
  fullHeight?: boolean
}

export const Loader = ({ className, fullHeight }: LoaderProps) => (
  <div
    className={`loader ${className || ""} ${fullHeight ? "loader--full" : ""}`}
  ></div>
)
