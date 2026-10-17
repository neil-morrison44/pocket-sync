import { useEffect, useRef, useState } from "react"

/**
 * Whether the element has scrolled up behind the sticky header bar, e.g. to
 * show a page's title in the header once its own heading is gone.
 *
 * @param headerHeight Space the header covers at the top, in pixels.
 */
export const useScrolledPast = <T extends Element>(headerHeight = 48) => {
  const ref = useRef<T>(null)
  const [scrolledPast, setScrolledPast] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const top = entry.rootBounds?.top ?? headerHeight
        setScrolledPast(
          !entry.isIntersecting && entry.boundingClientRect.bottom <= top
        )
      },
      { rootMargin: `-${headerHeight}px 0px 0px 0px` }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [headerHeight])

  return [ref, scrolledPast] as const
}
