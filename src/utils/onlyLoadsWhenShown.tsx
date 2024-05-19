import { MutableRefObject, ReactNode, useEffect, useRef, useState } from "react"

export const OnlyLoadsWhenShown = ({
  height,
  children,
}: {
  height: number
  children: ReactNode
}) => {
  const placeHolderDivRef = useRef<HTMLDivElement>(null)
  const hasBeenShown = useHasBeenShown(placeHolderDivRef)
  if (!hasBeenShown)
    return <div ref={placeHolderDivRef} style={{ height: `${height}px` }}></div>
  return <>{children}</>
}

const useHasBeenShown = (element: MutableRefObject<HTMLElement | null>) => {
  const [hasBeenShown, setState] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && element.current) {
        setState(true)
        observer.unobserve(element.current)
      }
    })

    const node = element.current
    node && observer.observe(node)
    return () => {
      node && observer.unobserve(node)
    }
  }, [element])
  return hasBeenShown
}
