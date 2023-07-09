import React, { ReactNode, useContext, useDeferredValue, useMemo } from "react"
import { fuzzy } from "fast-fuzzy"

export type Other = {
  onlyUpdates?: boolean
  category?: string
}

export const SearchContext = React.createContext<{
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
