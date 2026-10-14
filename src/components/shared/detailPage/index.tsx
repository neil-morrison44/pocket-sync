import { ReactNode } from "react"
import clsx from "clsx"

import { useScrolledPast } from "../../../hooks/useScrolledPast"
import { Controls, ControlsActions, ControlsTitle } from "../../controls"
import { ControlsBackButton } from "../../controls/inputs/backButton"

import "./index.css"

type DetailPageProps = {
  /** Label of the back button, e.g. "Back to Cores". */
  backLabel: string
  onBack: () => void
  /** Shown in the header bar once the page is scrolled. */
  title: ReactNode
  /** Secondary info next to the title in the header bar, e.g. the platform. */
  titleDetail?: ReactNode
  /**
   * Buttons for the header bar, usually the same as next to the page title
   * (see `DetailHeading`), so they stay reachable while scrolled.
   */
  actions?: ReactNode
  /** Full-width image at the top, e.g. the platform image. */
  banner?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * The layout for one item (a core, a platform): a back button floating on
 * a full-width banner, then the content, starting with a `DetailHeading`.
 * There's no header bar at the top; it slides in as soon as the page
 * scrolls, with the back button, the title and the actions.
 */
export const DetailPage = ({
  backLabel,
  onBack,
  title,
  titleDetail,
  actions,
  banner,
  children,
  className,
}: DetailPageProps) => {
  const [sentinelRef, scrolledPast] = useScrolledPast<HTMLDivElement>()

  return (
    <div className={clsx("detail-page", className)}>
      <div
        className={clsx(
          "detail-page__sticky",
          scrolledPast && "detail-page__sticky--is-visible"
        )}
        inert={!scrolledPast}
      >
        <Controls>
          <ControlsBackButton onClick={onBack} escapeKey={false}>
            {backLabel}
          </ControlsBackButton>
          <ControlsTitle>
            {title}
            {titleDetail && (
              <span className="controls__title-detail">{titleDetail}</span>
            )}
          </ControlsTitle>
          {actions && <ControlsActions>{actions}</ControlsActions>}
        </Controls>
      </div>

      <div className="detail-page__top" data-tauri-drag-region>
        {banner}
        <div className="detail-page__back">
          <ControlsBackButton onClick={onBack}>{backLabel}</ControlsBackButton>
        </div>
        {/* Just below the back button: the bar takes over once it's gone */}
        <div ref={sentinelRef} className="detail-page__sentinel" />
      </div>

      {children}
    </div>
  )
}

type DetailHeadingProps = {
  title: ReactNode
  /** Icon buttons next to the title, e.g. Archive. */
  actions?: ReactNode
  /** Subtitle lines and tags below the title. */
  children?: ReactNode
  className?: string
}

/** The item's title with its actions on the same row, then details. */
export const DetailHeading = ({
  title,
  actions,
  children,
  className,
}: DetailHeadingProps) => (
  <header className={clsx("detail-page__heading", className)}>
    <div className="detail-page__title-row">
      <h2 className="detail-page__title">{title}</h2>
      {actions && <div className="detail-page__actions">{actions}</div>}
    </div>
    {children}
  </header>
)

/** A titled block of a detail page, e.g. inside a tab. */
export const DetailSection = ({
  title,
  children,
  className,
}: {
  title: ReactNode
  children: ReactNode
  className?: string
}) => (
  <section className={clsx("detail-page__section", className)}>
    <h3 className="detail-page__section-title">{title}</h3>
    {children}
  </section>
)

export type DetailFact = {
  label: string
  value: ReactNode
}

/** Spec-sheet style facts: small labels above their values. */
export const DetailFacts = ({ facts }: { facts: DetailFact[] }) => (
  <dl className="detail-page__facts">
    {facts.map(({ label, value }) => (
      <div className="detail-page__fact" key={label}>
        <dt className="detail-page__fact-label">{label}</dt>
        <dd className="detail-page__fact-value">{value}</dd>
      </div>
    ))}
  </dl>
)
