import { ReactNode, startTransition, useEffect } from "react"
import Button from "../../ui/Button"

type ControlsBackButtonProps = {
  children: ReactNode
  onClick: () => void
}

export const ControlsBackButton = ({
  children,
  onClick,
}: ControlsBackButtonProps) => {
  useEffect(() => {
    const listener = ({ key }: KeyboardEvent) => {
      if (key === "Escape") {
        // ugly check to see if there's a modal or an open select list
        if (document.querySelector(".modal, .select__content")) return
        onClick()
      }
    }
    document.addEventListener("keydown", listener)
    return () => document.removeEventListener("keydown", listener)
  }, [onClick])
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
