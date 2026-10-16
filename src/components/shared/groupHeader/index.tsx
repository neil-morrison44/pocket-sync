import { ReactNode } from "react"

import "./index.css"

type GroupHeaderProps = {
  /** The group's name, e.g. a core or a game; may be a link. */
  title: ReactNode
  /** Soft details after the title, e.g. the platform. */
  detail?: ReactNode
  /** Shown at the end, e.g. how many items the group has. */
  count?: ReactNode
}

/**
 * The heading of one group in a sectioned list (e.g. save states per core,
 * screenshots per game). It sticks below the header bar while its group is
 * in view.
 */
export const GroupHeader = ({ title, detail, count }: GroupHeaderProps) => (
  <header className="group-header">
    <span className="group-header__title">
      {title}
      {detail && <span className="group-header__detail">{detail}</span>}
    </span>
    {count && <span className="group-header__count">{count}</span>}
  </header>
)
