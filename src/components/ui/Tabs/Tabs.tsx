import React, { ReactNode, useState } from "react"

import * as RadixTabs from "@radix-ui/react-tabs"
import clsx from "clsx"

import "./Tabs.css"

export interface TabItem {
  value: string
  label: ReactNode
  content: ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  defaultValue?: string
  /** Accessible name for the tab list. */
  label: string
  className?: string
}

const Tabs = ({ tabs, defaultValue, label, className }: TabsProps) => {
  const initialValue = defaultValue ?? tabs[0]?.value
  // Tabs stay mounted once opened, so their content (and anything it loaded)
  // survives switching back and forth
  const [visited, setVisited] = useState<string[]>([initialValue])

  return (
    <RadixTabs.Root
      className={clsx("tabs", className)}
      defaultValue={initialValue}
      onValueChange={(value) =>
        setVisited((current) =>
          current.includes(value) ? current : [...current, value]
        )
      }
    >
      <RadixTabs.List className="tabs__list" aria-label={label}>
        {tabs.map(({ value, label: tabLabel }) => (
          <RadixTabs.Trigger
            key={value}
            value={value}
            className="tabs__trigger"
          >
            {tabLabel}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map(({ value, content }) =>
        visited.includes(value) ? (
          <RadixTabs.Content
            key={value}
            value={value}
            className="tabs__content"
            forceMount
            tabIndex={-1}
          >
            {content}
          </RadixTabs.Content>
        ) : null
      )}
    </RadixTabs.Root>
  )
}

export default React.memo(Tabs)
