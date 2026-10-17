import { ReactNode, useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import clsx from "clsx"

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
 * When the bar is too narrow and the group starts a row of its own, the
 * line and the space go: the row break sets it off already.
 */
export const ControlsGroup = ({
  title,
  onClear,
  children,
}: ControlsGroupProps) => {
  const { t } = useTranslation("app")
  const ref = useRef<HTMLDivElement>(null)
  const isWrapped = useStartsOwnRow(ref)
  return (
    <div
      ref={ref}
      className={clsx(
        "controls__group",
        isWrapped && "controls__group--is-wrapped"
      )}
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

/**
 * Whether the element sits below the control before it (its row wrapped),
 * rechecked whenever the bar changes size. Once wrapped it loses its indent,
 * so it only moves back up when it would fit with the indent again;
 * otherwise it would flip between the rows.
 */
const useStartsOwnRow = (ref: React.RefObject<HTMLElement | null>) => {
  const [isWrapped, setIsWrapped] = useState(false)
  const wrappedRef = useRef(false)
  const indentRef = useRef(0)

  useLayoutEffect(() => {
    const element = ref.current
    const bar = element?.parentElement
    if (!element || !bar) return

    const set = (wrapped: boolean) => {
      wrappedRef.current = wrapped
      setIsWrapped(wrapped)
    }

    const check = () => {
      const previous = element.previousElementSibling
      if (!previous) return set(false)
      const previousRect = previous.getBoundingClientRect()

      if (!wrappedRef.current) {
        const style = getComputedStyle(element)
        indentRef.current =
          parseFloat(style.marginInlineStart) +
          parseFloat(style.paddingInlineStart)
        return set(element.getBoundingClientRect().top >= previousRect.bottom)
      }

      // The width its controls need on one line, plus the indent
      const children = Array.from(element.children)
      const groupGap = parseFloat(getComputedStyle(element).columnGap) || 0
      const needed =
        children.reduce((sum, child) => sum + child.clientWidth, 0) +
        groupGap * Math.max(0, children.length - 1) +
        indentRef.current
      const barStyle = getComputedStyle(bar)
      const room =
        bar.getBoundingClientRect().right -
        parseFloat(barStyle.paddingInlineEnd) -
        previousRect.right -
        (parseFloat(barStyle.columnGap) || 0)
      // Controls after it still on the first row (e.g. the actions) need room too
      let after = element.nextElementSibling
      let taken = 0
      while (after) {
        if (after.getBoundingClientRect().top < previousRect.bottom)
          taken += after.clientWidth + (parseFloat(barStyle.columnGap) || 0)
        after = after.nextElementSibling
      }
      if (needed <= room - taken) set(false)
    }

    check()
    const observer = new ResizeObserver(check)
    observer.observe(bar)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return isWrapped
}
