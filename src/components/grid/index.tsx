import {
  Children,
  MutableRefObject,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react"
import "./index.css"

type GridProps = {
  children: ReactNode
  className?: string
  placeholderItemHeight?: number
}

export const Grid = ({
  children,
  className,
  placeholderItemHeight = 200,
}: GridProps) => {
  const items = Children.toArray(children)

  return (
    <div className={`grid ${className ?? ""}`}>
      {Children.toArray(
        items.map((i) => (
          <OnlyLoadsWhenShown height={placeholderItemHeight}>
            {i}
          </OnlyLoadsWhenShown>
        ))
      )}
    </div>
  )
}

const OnlyLoadsWhenShown = ({
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
    element.current && observer.observe(element.current)
    return () => {
      element.current && observer.unobserve(element.current)
    }
  }, [])
  return hasBeenShown
}
