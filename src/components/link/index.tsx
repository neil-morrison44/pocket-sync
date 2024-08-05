import { ReactNode } from "react"
import { open } from "@tauri-apps/plugin-shell"

import "./index.css"

type LinkProps = {
  href?: string
  className?: string
  children: ReactNode
}

export const Link = ({ children, className, href }: LinkProps) => {
  return (
    <span
      className={`link ${className ?? ""}`}
      onClick={() => {
        if (href) open(href)
      }}
    >
      {children}
    </span>
  )
}
