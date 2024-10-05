import { ComponentPropsWithoutRef, ReactNode } from "react"
import { open } from "@tauri-apps/plugin-shell"

import "./index.css"

type LinkProps = {
  href?: string
  className?: string
  children: ReactNode
} & ComponentPropsWithoutRef<"span">

export const Link = ({
  children,
  className,
  href,
  ...otherProps
}: LinkProps) => {
  return (
    <span
      {...otherProps}
      className={`link ${className ?? ""}`}
      onClick={() => {
        if (href) open(href)
      }}
    >
      {children}
    </span>
  )
}
