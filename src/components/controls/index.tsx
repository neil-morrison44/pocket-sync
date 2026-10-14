import { ReactNode } from "react"
import clsx from "clsx"
import "./index.css"

type ControlProps = {
  children?: ReactNode
}

type ControlsBarProps = ControlProps & {
  /**
   * `sticky` (default) stays at the top while scrolling; `static` scrolls
   * with the page, e.g. above a detail page's image.
   */
  variant?: "sticky" | "static"
  className?: string
}

// Header bar layout: back button, search and filters on the left; actions
// (wrapped in ControlsActions) on the right.
export const Controls = ({
  children,
  variant = "sticky",
  className,
}: ControlsBarProps) => (
  <div
    className={clsx("controls", `controls--variant-${variant}`, className)}
    data-tauri-drag-region
  >
    {children}
  </div>
)

export const ControlsActions = ({ children }: ControlProps) => (
  <div className="controls__actions">{children}</div>
)

type ControlsTitleProps = {
  children: ReactNode
  /** Hidden (faded out) while the page shows the same title itself. */
  visible?: boolean
}

/** The page's title in the header bar, e.g. a core's name when scrolled. */
export const ControlsTitle = ({
  children,
  visible = true,
}: ControlsTitleProps) => (
  <div
    className={clsx(
      "controls__title",
      !visible && "controls__title--is-hidden"
    )}
    aria-hidden={!visible}
  >
    {children}
  </div>
)
