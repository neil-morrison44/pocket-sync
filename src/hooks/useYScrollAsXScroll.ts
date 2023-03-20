import { useEffect, useRef } from "react"

export const useYScrollAsXScroll = () => {
  const elRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!elRef.current) return
    const el = elRef.current
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return
      e.preventDefault()
      el.scrollTo({
        left: el.scrollLeft + e.deltaY,
        behavior: "smooth",
      })
    }
    el.addEventListener("wheel", onWheel)
    return () => el.removeEventListener("wheel", onWheel)
  }, [])
  return elRef
}
