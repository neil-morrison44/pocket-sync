import { CSSProperties, ReactNode, startTransition } from "react"
import Button, { ButtonTheme } from "../../ui/Button"
import { IconOptions } from "../../ui/Icon"
import Spinner from "../../ui/Spinner"

type ControlsButtonProps = {
  children: ReactNode
  onClick: () => void
  style?: CSSProperties
  icon?: IconOptions
  theme?: ButtonTheme
  /**
   * While true, a spinner takes the icon's place and the button is
   * disabled, e.g. while a refresh runs (it runs in a transition, so the
   * page itself keeps showing the old state meanwhile).
   */
  loading?: boolean
  disabled?: boolean
}

export const ControlsButton = ({
  children,
  onClick,
  style,
  icon,
  theme,
  loading = false,
  disabled = false,
}: ControlsButtonProps) => (
  <Button
    onClick={() => startTransition(onClick)}
    style={style}
    icon={loading ? undefined : icon}
    theme={theme}
    disabled={loading || disabled}
    aria-busy={loading || undefined}
  >
    {loading && <Spinner size={20} />}
    {children}
  </Button>
)
