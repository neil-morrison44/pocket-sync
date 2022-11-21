import { useCallback, useState } from "react"

export const useSaveScroll = () => {
  const [savedScroll, setSavedScroll] = useState<number | null>(null)

  const pushScroll = useCallback(() => {
    setSavedScroll(window.pageYOffset)
    window.scrollTo({ top: 0 })
  }, [])

  const popScroll = useCallback(() => {
    requestAnimationFrame(() => {
      if (savedScroll) window.scrollTo({ top: savedScroll })
      setSavedScroll(null)
    })
  }, [savedScroll])

  return { pushScroll, popScroll }
}
