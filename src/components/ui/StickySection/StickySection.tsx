import React, { ReactNode } from "react"

import clsx from "clsx"

import "./StickySection.css"

export interface StickySectionProps {
  /** Element id, e.g. for scroll spies and jump links. */
  id: string
  title: ReactNode
  children: ReactNode
  className?: string
}

/**
 * A titled section whose title sticks to the top while the section is in
 * view, so long pages always show where you are.
 */
const StickySection = ({
  id,
  title,
  children,
  className,
}: StickySectionProps) => (
  <section
    id={id}
    className={clsx("sticky-section", className)}
    aria-labelledby={`${id}-title`}
  >
    <h2 className="sticky-section__title" id={`${id}-title`}>
      {title}
    </h2>
    <div className="sticky-section__content">{children}</div>
  </section>
)

export default React.memo(StickySection)
