import { ComponentPropsWithoutRef, ReactNode } from "react"
import { open } from "@tauri-apps/plugin-shell"

import "./index.css"

type LinkProps = {
  href?: string
  className?: string
  children: ReactNode
} & ComponentPropsWithoutRef<"a">

/**
 * A link that opens in the system browser. It renders a real `<a>`, so it can
 * be focused and activated with the keyboard. With `onClick` and no `href`,
 * it's an in-app link (e.g. to another view) instead.
 */
export const Link = ({
  children,
  className,
  href,
  onClick,
  ...otherProps
}: LinkProps) => {
  return (
    <a
      {...otherProps}
      href={href ?? "#"}
      className={`link ${className ?? ""}`}
      onClick={(event) => {
        event.preventDefault()
        if (onClick) onClick(event)
        else if (href) open(href)
      }}
    >
      {children}
    </a>
  )
}
