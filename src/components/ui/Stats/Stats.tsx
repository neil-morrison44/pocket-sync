import React, { ReactNode } from "react"

import clsx from "clsx"

import "./Stats.css"

export interface StatItem {
  label: string
  value: ReactNode
}

export interface StatsProps {
  items: StatItem[]
  className?: string
}

/** A row of figures with small labels, e.g. installed cores or games. */
const Stats = ({ items, className }: StatsProps) => (
  <dl className={clsx("stats", className)}>
    {items.map(({ label, value }) => (
      <div key={label} className="stats__item">
        <dt className="stats__label">{label}</dt>
        <dd className="stats__value">{value}</dd>
      </div>
    ))}
  </dl>
)

export default React.memo(Stats)
