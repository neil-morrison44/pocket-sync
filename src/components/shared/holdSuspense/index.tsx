import { ReactNode, Suspense, useLayoutEffect, useRef } from "react"

type HoldSuspendProps = {
  children: ReactNode
}

export const HoldSuspense = ({ children }: HoldSuspendProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const htmlRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const html = container.innerHTML
    if (html) htmlRef.current = html

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver((mutationList) => {
      console.log({ mutationList })
      const html = container.innerHTML
      if (html) htmlRef.current = html
    })

    observer.observe(container, {
      attributes: true,
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="hold-suspend"
      ref={containerRef}
      style={{ display: "contents" }}
    >
      <Suspense
        fallback={
          <div
            style={{ display: "contents" }}
            dangerouslySetInnerHTML={{ __html: htmlRef.current || "" }}
          ></div>
        }
      >
        {children}
      </Suspense>
    </div>
  )
}
