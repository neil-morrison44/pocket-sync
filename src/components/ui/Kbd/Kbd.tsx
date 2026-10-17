import React, { useEffect, useState } from "react"

import clsx from "clsx"

import "./Kbd.css"

/** `mod` is ⌘ on macOS and Ctrl elsewhere. Other keys are shown as written. */
export type KbdKey = "mod" | "alt" | "shift" | string

export interface KbdProps {
  keys: KbdKey[]
  className?: string
}

export const isMac =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent)

const MODIFIER_EVENT_KEYS: Record<string, string> = {
  mod: isMac ? "Meta" : "Control",
  alt: "Alt",
  shift: "Shift",
}

const MODIFIER_LABELS: Record<string, [mac: string, other: string]> = {
  mod: ["⌘", "Ctrl"],
  alt: ["⌥", "Alt"],
  shift: ["⇧", "Shift"],
}

const isModifier = (eventKey: string) =>
  ["Meta", "Control", "Alt", "Shift"].includes(eventKey)

/** A keyboard shortcut as key caps, e.g. ⌘ F; each lights up while held. */
const Kbd = ({ keys, className }: KbdProps) => (
  <kbd className={clsx("kbd", className)}>
    {keys.map((key) => (
      <SingleKey key={key} keyboardKey={key} />
    ))}
  </kbd>
)

const SingleKey = ({ keyboardKey }: { keyboardKey: KbdKey }) => {
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    const matches = (event: KeyboardEvent) =>
      event.key === MODIFIER_EVENT_KEYS[keyboardKey] ||
      event.key.toLowerCase() === keyboardKey.toLowerCase()

    const down = (event: KeyboardEvent) => {
      if (matches(event)) setIsPressed(true)
    }
    const up = (event: KeyboardEvent) => {
      if (matches(event)) setIsPressed(false)
      // macOS swallows the letter's keyup while ⌘ is held, so releasing a
      // modifier releases the letter too
      if (!MODIFIER_EVENT_KEYS[keyboardKey] && isModifier(event.key))
        setIsPressed(false)
    }
    const reset = () => setIsPressed(false)

    document.addEventListener("keydown", down)
    document.addEventListener("keyup", up)
    window.addEventListener("blur", reset)
    return () => {
      document.removeEventListener("keydown", down)
      document.removeEventListener("keyup", up)
      window.removeEventListener("blur", reset)
    }
  }, [keyboardKey])

  const labels = MODIFIER_LABELS[keyboardKey]
  const label = labels ? labels[isMac ? 0 : 1] : keyboardKey

  return (
    <span
      className={clsx(
        "kbd__key",
        isPressed && "kbd__key--is-pressed",
        label.length > 1 && "kbd__key--is-wide"
      )}
    >
      {label}
    </span>
  )
}

export default React.memo(Kbd)
