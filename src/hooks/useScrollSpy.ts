import { useEffect, useState } from "react"

/**
 * Returns the id of the first element (in `ids` order) that is in the upper
 * part of the window, for navs that highlight the section being read.
 *
 * @param ids element ids, in page order
 * @param rootMargin which part of the viewport counts as "being read"
 */
export const useScrollSpy = (
  ids: readonly string[],
  rootMargin = "0px 0px -60% 0px"
) => {
  const [active, setActive] = useState<string | undefined>(ids[0])

  useEffect(() => {
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const first = ids.find((id) => visible.has(id))
        if (first) setActive(first)
      },
      { rootMargin }
    )
    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [ids, rootMargin])

  return [active, setActive] as const
}
