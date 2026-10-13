import {
  FocusEvent,
  KeyboardEvent,
  RefObject,
  useCallback,
  useEffect,
} from "react"
import {
  getSpatialNeighbor,
  isNavigationKey,
} from "../utils/getSpatialNeighbor"

/**
 * Makes a group of items a single tab stop (roving tabindex): Tab enters the
 * group on the last focused item, arrow keys move by on-screen position,
 * Home/End jump to the ends, and Enter/Space activate `role="button"` items.
 *
 * Works on the DOM rather than React state, so it copes with items that are
 * lazily rendered or hidden by search filters.
 */
export const useRovingFocus = (
  containerRef: RefObject<HTMLElement | null>,
  itemSelector: string
) => {
  const getItems = useCallback(
    () =>
      Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(itemSelector) ?? []
      ),
    [containerRef, itemSelector]
  )

  const setTabStop = useCallback(
    (tabStop: HTMLElement | undefined) => {
      for (const item of getItems()) item.tabIndex = item === tabStop ? 0 : -1
    },
    [getItems]
  )

  // keep exactly one tab stop as items appear and disappear
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const sync = () => {
      const items = getItems()
      setTabStop(items.find((item) => item.tabIndex === 0) ?? items[0])
    }

    sync()
    const observer = new MutationObserver(sync)
    observer.observe(container, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [containerRef, getItems, setTabStop])

  const onFocus = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      const target = event.target as HTMLElement
      if (getItems().includes(target)) setTabStop(target)
    },
    [getItems, setTabStop]
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const items = getItems()
      const current = event.target as HTMLElement
      if (!items.includes(current)) return

      if (event.key === "Enter" || event.key === " ") {
        if (current.getAttribute("role") === "button") {
          event.preventDefault()
          current.click()
        }
        return
      }

      if (!isNavigationKey(event.key)) return
      event.preventDefault()
      getSpatialNeighbor(items, current, event.key)?.focus()
    },
    [getItems]
  )

  return { onFocus, onKeyDown }
}
