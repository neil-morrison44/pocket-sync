import { useEffect } from "react"

const KEYBOARD_FOCUS_CLASS = "keyboard-focus"

// Keys that move focus: Tab, plus the arrow/Home/End keys used by tab groups
// and grids (roving tabindex)
const FOCUS_KEYS = [
  "Tab",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
]

/**
 * Adds `keyboard-focus` to `<html>` while the user navigates with the
 * keyboard and removes it on the next mouse press, so focus rings only show
 * for keyboard users (via
 * https://medium.com/hackernoon/removing-that-ugly-focus-ring-and-keeping-it-too-6c8727fefcd2).
 * Styles target `:root.keyboard-focus …:focus`. Call once at the app root.
 */
export const useKeyboardFocus = () => {
  useEffect(() => {
    const root = document.documentElement

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!FOCUS_KEYS.includes(event.key)) return
      root.classList.add(KEYBOARD_FOCUS_CLASS)
      window.removeEventListener("keydown", handleKeyDown)
      window.addEventListener("mousedown", handleMouseDown)
    }

    const handleMouseDown = () => {
      root.classList.remove(KEYBOARD_FOCUS_CLASS)
      window.removeEventListener("mousedown", handleMouseDown)
      window.addEventListener("keydown", handleKeyDown)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("mousedown", handleMouseDown)
      root.classList.remove(KEYBOARD_FOCUS_CLASS)
    }
  }, [])
}
