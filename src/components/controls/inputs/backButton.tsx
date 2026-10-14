import { ReactNode, startTransition, useEffect } from "react"
import Button from "../../ui/Button"

type ControlsBackButtonProps = {
  children: ReactNode
  onClick: () => void
  /**
   * Also goes back on Escape (default). Turn off for a second copy of the
   * button, so one Escape doesn't go back twice.
   */
  escapeKey?: boolean
}

export const ControlsBackButton = ({
  children,
  onClick,
  escapeKey = true,
}: ControlsBackButtonProps) => {
  useEffect(() => {
    if (!escapeKey) return
    const listener = ({ key }: KeyboardEvent) => {
      if (key === "Escape") {
        // ugly check to see if there's a modal or an open select list
        if (document.querySelector(".modal, .select__content")) return
        onClick()
      }
    }
    document.addEventListener("keydown", listener)
    return () => document.removeEventListener("keydown", listener)
  }, [onClick, escapeKey])
  return (
    <Button
      icon="chevron-left"
      className="controls__back-button"
      onClick={() => startTransition(onClick)}
    >
      {children}
    </Button>
  )
}
