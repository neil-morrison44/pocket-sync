import { useCallback, useEffect, useRef, useState } from "react"

/** How long a jump may take before the spy takes over again (fallback). */
const JUMP_TIMEOUT_MS = 1000

/**
 * Tracks which element (by id) is being read, for navs that highlight the
 * current section. `jumpTo` scrolls to an element and highlights it right
 * away, ignoring the elements passed on the way, so the nav doesn't flash.
 *
 * @param ids element ids, in page order
 * @param rootMargin which part of the viewport counts as "being read"
 */
export const useScrollSpy = (
  ids: readonly string[],
  rootMargin = "0px 0px -60% 0px"
) => {
  const [active, setActive] = useState<string | undefined>(ids[0])
  const jumpingRef = useRef(false)

  useEffect(() => {
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        if (jumpingRef.current) return
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

  /**
   * Scrolls to `targetId` (defaults to `activeId`) and marks `activeId` as
   * active.
   */
  const jumpTo = useCallback((activeId: string, targetId = activeId) => {
    setActive(activeId)
    jumpingRef.current = true

    const release = () => {
      jumpingRef.current = false
      window.removeEventListener("scrollend", release)
    }
    window.addEventListener("scrollend", release)
    setTimeout(release, JUMP_TIMEOUT_MS)

    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  return { active, jumpTo }
}
