import { ReactNode } from "react"
import { open } from "@tauri-apps/api/shell"

import "./index.css"

type LinkProps = {
  href?: string
  className?: string
  children: ReactNode
}

export const Link = ({ children, className, href }: LinkProps) => {
  return (
    <div
      className={`link ${className}`}
      onClick={() => {
        if (href) open(href)
      }}
    >
      {children}
    </div>
  )
}
