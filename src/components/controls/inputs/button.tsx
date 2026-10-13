import { CSSProperties, ReactNode, startTransition } from "react"
import Button, { ButtonTheme } from "../../ui/Button"
import { IconOptions } from "../../ui/Icon"

type ControlsButtonProps = {
  children: ReactNode
  onClick: () => void
  style?: CSSProperties
  icon?: IconOptions
  theme?: ButtonTheme
}

export const ControlsButton = ({
  children,
  onClick,
  style,
  icon,
  theme,
}: ControlsButtonProps) => (
  <Button
    onClick={() => startTransition(onClick)}
    style={style}
    icon={icon}
    theme={theme}
  >
    {children}
  </Button>
)
