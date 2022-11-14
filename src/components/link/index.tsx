import { ReactNode } from "react"
import { open } from "@tauri-apps/api/shell"

import "./index.css"

type LinkProps = {
  href?: string
  children: ReactNode
}

export const Link = ({ children, href }: LinkProps) => {
  return (
    <div
      className="link"
      onClick={() => {
        if (href) open(href)
      }}
    >
      {children}
    </div>
  )
}
