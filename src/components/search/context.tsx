import { LicenseFilter } from "../cores/features"
import React, { ReactNode, useContext, useDeferredValue, useMemo } from "react"
import { fuzzy } from "fast-fuzzy"
import type { CoreFeature } from "../cores/features"

export type SearchOther = Other

type Other = {
  onlyUpdates?: boolean
  category?: string
  /** Only show cores that support all of these. */
  features?: CoreFeature[]
  /** Only show cores for this platform id ("All" for any). */
  platform?: string
  /** Only show items by this author, e.g. a plugin's GitHub owner. */
  author?: string
  /** Only show items of this game, e.g. save states ("All" for any). */
  game?: string
  /** Cores: any, only free, or only ones that need a license. */
  license?: LicenseFilter
  /** Cores: the highest acceptable AI-ness (0–1); null for any. */
  maxAi?: number | null
}

const SearchContext = React.createContext<{
  query: string
  other?: Other
}>({ query: "" })

export const SearchContextProvider = ({
  query,
  other,
  children,
}: {
  query: string
  other?: Other
  children: ReactNode
}) => {
  const deferredQuery = useDeferredValue(query)
  const value = useMemo(
    () => ({ query: deferredQuery, other }),
    [deferredQuery, other]
  )

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  )
}

/** The current search query and filters, for lists that filter themselves. */
export const useSearchContext = () => useContext(SearchContext)

export const SearchContextSelfHidingConsumer = ({
  fields,
  children,
  threshold = 0.8,
  otherFn,
}: {
  fields: string[]
  children: ReactNode
  threshold?: number
  otherFn?: (other: Other) => boolean
}) => {
  const { query, other } = useContext(SearchContext)
  const score = useMemo(() => {
    if (query.length === 0) return 1

    return fields.reduce(
      (score, field) =>
        Math.max(
          score,
          fuzzy(query.toLowerCase().trim(), field.toLowerCase().trim())
        ),
      0
    )
  }, [fields, query])

  if (otherFn && other && !otherFn(other)) return null

  if (score > threshold) return <>{children}</>
  return null
}
