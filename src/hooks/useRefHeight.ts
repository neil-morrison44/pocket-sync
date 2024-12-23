import { useCallback, useLayoutEffect, useRef } from "react"

export const useRefHeight = () => {
  const heightRef = useRef<number>(window.innerHeight)
  const contentRef = useCallback((div: HTMLDivElement | null) => {
    if (div) {
      heightRef.current = div.scrollHeight
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentBoxSize) {
            const contentBoxSize = entry.contentBoxSize[0]
            heightRef.current = div.scrollHeight
          }
        }
      })
      resizeObserver.observe(div)
    }
  }, [])
  return [contentRef, heightRef] as const
}
