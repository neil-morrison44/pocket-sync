import React, { ReactNode, Suspense, useRef, useState } from "react"

import * as RadixTabs from "@radix-ui/react-tabs"
import clsx from "clsx"

import { Loader } from "../../loader"

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
  const [active, setActive] = useState(initialValue)

  // The tab switched to starts at least as tall as the one before: a shorter
  // tab (or its loader) would make the page shorter than where it's
  // scrolled, and the browser would jump up towards the top
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined)

  return (
    <RadixTabs.Root
      className={clsx("tabs", className)}
      value={active}
      onValueChange={(value) => {
        setMinHeight(contentRefs.current[active]?.offsetHeight)
        setActive(value)
        setVisited((current) =>
          current.includes(value) ? current : [...current, value]
        )
      }}
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
            ref={(element) => {
              contentRefs.current[value] = element
            }}
            style={value === active ? { minHeight } : undefined}
          >
            {/* A tab that loads data on first open shows its own loader,
                instead of suspending the whole page (which lost the scroll
                position) */}
            <Suspense fallback={<Loader className="tabs__loader" />}>
              {content}
            </Suspense>
          </RadixTabs.Content>
        ) : null
      )}
    </RadixTabs.Root>
  )
}

export default React.memo(Tabs)
