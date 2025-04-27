import { ReactNode, startTransition } from "react"

type ControlsButtonProps = {
  children: ReactNode
  onClick: () => void
}

export const ControlsButton = ({ children, onClick }: ControlsButtonProps) => (
  <div
    role="button"
    className="controls__button"
    onClick={() => startTransition(onClick)}
  >
    {children}
  </div>
)
