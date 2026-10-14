import React, { ReactNode } from "react"

import clsx from "clsx"

import Icon, { IconOptions } from "../Icon"

import "./EmptyState.css"

export interface EmptyStateProps {
  icon: IconOptions
  title: ReactNode
  /** What the page is for, or how to fill it. */
  children?: ReactNode
  /** E.g. the button that adds the first item. */
  action?: ReactNode
  className?: string
}

/** Shown when a page has nothing to list yet: icon, title, hint, action. */
const EmptyState = ({
  icon,
  title,
  children,
  action,
  className,
}: EmptyStateProps) => (
  <div className={clsx("empty-state", className)}>
    <Icon icon={icon} size={48} className="empty-state__icon" />
    <h2 className="empty-state__title">{title}</h2>
    {children && <div className="empty-state__text">{children}</div>}
    {action && <div className="empty-state__action">{action}</div>}
  </div>
)

export default React.memo(EmptyState)
