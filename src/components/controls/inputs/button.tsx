import { ReactNode } from "react"

type ControlsButtonProps = {
  children: ReactNode
  onClick: () => void
}

export const ControlsButton = ({ children, onClick }: ControlsButtonProps) => (
  <div role="button" className="controls__button" onClick={onClick}>
    {children}
  </div>
)
