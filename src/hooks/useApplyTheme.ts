import { useEffect } from "react"
import { useAtomValue } from "jotai"
import { stylePreferenceAtom, themePreferenceAtom } from "../jotai/theme/atoms"

const LIGHT_QUERY = "(prefers-color-scheme: light)"

/**
 * Sets `data-theme` on `<html>` from the theme preference ("system" follows
 * the OS setting live) and `data-style` from the style preference. Call once
 * inside the app's jotai Provider.
 */
export const useApplyTheme = () => {
  const preference = useAtomValue(themePreferenceAtom)
  const style = useAtomValue(stylePreferenceAtom)

  useEffect(() => {
    document.documentElement.dataset.style = style
  }, [style])

  useEffect(() => {
    const root = document.documentElement
    if (preference !== "system") {
      root.dataset.theme = preference
      return
    }

    const media = window.matchMedia(LIGHT_QUERY)
    const apply = () => {
      root.dataset.theme = media.matches ? "light" : "dark"
    }
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [preference])
}
