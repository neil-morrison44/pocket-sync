import { ComponentPropsWithoutRef, ReactNode } from "react"
import { open } from "@tauri-apps/plugin-shell"

import "./index.css"

type LinkProps = {
  href?: string
  className?: string
  /**
   * No underline until hovered, for links that are titles (e.g. a game's
   * name as a section heading), where an underline is too much.
   */
  subtle?: boolean
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
  subtle = false,
  ...otherProps
}: LinkProps) => {
  return (
    <a
      {...otherProps}
      href={href ?? "#"}
      className={`link ${subtle ? "link--subtle" : ""} ${className ?? ""}`}
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
