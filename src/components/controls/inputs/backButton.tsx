import { ReactNode, useEffect } from "react"

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
        // ugly check to see if there's a modal open
        if (document.getElementsByClassName("modal").length > 0) return
        onClick()
      }
    }
    document.addEventListener("keydown", listener)
    return () => document.removeEventListener("keydown", listener)
  }, [onClick])
  return (
    <div
      role="button"
      className="controls__item controls__button controls__button--back"
      onClick={onClick}
    >
      <BackIcon />
      {children}
    </div>
  )
}

const BackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24"
    viewBox="0 -960 960 960"
    width="24"
  >
    <path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z" />
  </svg>
)
