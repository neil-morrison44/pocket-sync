import React, { ReactNode, useContext, useDeferredValue, useMemo } from "react"
import { fuzzy } from "fast-fuzzy"

export const SearchContext = React.createContext({ query: "" })

export const SearchContextProvider = ({
  query,
  children,
}: {
  query: string
  children: ReactNode
}) => {
  const deferredQuery = useDeferredValue(query)
  const value = useMemo(() => ({ query: deferredQuery }), [deferredQuery])

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  )
}

export const SearchContextSelfHidingConsumer = ({
  fields,
  children,
  threshold = 0.8,
}: {
  fields: string[]
  children: ReactNode
  threshold?: number
}) => {
  const { query } = useContext(SearchContext)
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
  }, [query])

  if (score > threshold) return <>{children}</>
  return null
}
