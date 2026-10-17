import { RefObject, useEffect, useState } from "react"

/**
 * How many tiles are shown inside the element, kept up to date as tiles
 * load, hide or show (e.g. while searching, tiles hide themselves).
 */
export const useTileCount = (ref: RefObject<HTMLElement | null>) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setCount(element.querySelectorAll(".tile").length)
    update()
    const observer = new MutationObserver(update)
    observer.observe(element, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [ref])

  return count
}
