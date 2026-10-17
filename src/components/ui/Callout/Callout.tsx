import React, { ReactNode, Suspense } from "react"

import clsx from "clsx"
import { useAtom } from "jotai"
import { useTranslation } from "react-i18next"

import { dismissedNotesAtom } from "../../../jotai/settings/atoms"
import Icon from "../Icon"
import IconButton from "../IconButton"

import "./Callout.css"

/**
 * - `info`: context worth knowing (grey, info icon)
 * - `warning`: a consequence to be aware of (yellow, warning icon)
 */
export type CalloutVariant = "info" | "warning"

export interface CalloutProps {
  children: ReactNode
  variant?: CalloutVariant
  /**
   * Makes the note dismissible: a close button hides it for good (stored as
   * a setting; Settings → Display can show dismissed notes again). Use a
   * stable id per note, e.g. "cores-zip-install".
   */
  dismissId?: string
  className?: string
}

/** A tinted note with an icon, e.g. a warning next to a setting. */
const Callout = (props: CalloutProps) =>
  props.dismissId ? (
    <Suspense fallback={null}>
      <DismissibleCallout {...props} dismissId={props.dismissId} />
    </Suspense>
  ) : (
    <CalloutBox {...props} />
  )

const DismissibleCallout = (props: CalloutProps & { dismissId: string }) => {
  const [dismissed, setDismissed] = useAtom(dismissedNotesAtom)
  const { t } = useTranslation("app")

  if (dismissed.includes(props.dismissId)) return null
  return (
    <CalloutBox
      {...props}
      action={
        <IconButton
          icon="close"
          theme="tertiary"
          label={t("dismiss")}
          className="callout__dismiss"
          onClick={() => setDismissed([...dismissed, props.dismissId])}
        />
      }
    />
  )
}

const CalloutBox = ({
  children,
  variant = "info",
  className,
  action,
}: CalloutProps & { action?: ReactNode }) => (
  <div
    className={clsx("callout", `callout--variant-${variant}`, className)}
    role={variant === "warning" ? "note" : undefined}
  >
    <Icon icon={variant === "warning" ? "warning-diamond" : "info"} />
    <div className="callout__text">{children}</div>
    {action}
  </div>
)

export default React.memo(Callout)
