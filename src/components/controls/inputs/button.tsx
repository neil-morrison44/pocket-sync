import { CSSProperties, ReactNode, startTransition } from "react"

type ControlsButtonProps = {
  children: ReactNode
  onClick: () => void
  style?: CSSProperties
}

export const ControlsButton = ({
  children,
  onClick,
  style,
}: ControlsButtonProps) => (
  <div
    role="button"
    className="controls__button"
    onClick={() => startTransition(onClick)}
    style={style}
  >
    {children}
  </div>
)
