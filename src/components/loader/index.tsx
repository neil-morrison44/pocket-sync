import React from "react"
import "./index.css"

type LoaderProps = {
  className?: string
}

export const Loader = ({ className }: LoaderProps) => (
  <div className={`loader ${className || ""}`}></div>
)
