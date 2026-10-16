import { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import Button from "../../ui/Button"

type ControlsGroupProps = {
  /** Names the group for screen readers (not shown); "Filters" by default. */
  title?: string
  /**
   * Shown while any filter is set: a tertiary "Clear Filters" button at the
   * end of the group that resets them all.
   */
  onClear?: () => void
  children: ReactNode
}

/**
 * Related controls (the filters) set off from the display controls before
 * them (search, sort, grouping) by a dimmed vertical line and some space.
 */
export const ControlsGroup = ({
  title,
  onClear,
  children,
}: ControlsGroupProps) => {
  const { t } = useTranslation("app")
  return (
    <div
      className="controls__group"
      role="group"
      aria-label={title ?? t("filters")}
    >
      {children}
      {onClear && (
        <Button theme="tertiary" icon="close" onClick={onClear}>
          {t("clear_filters")}
        </Button>
      )}
    </div>
  )
}
