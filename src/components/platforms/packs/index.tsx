import { useRovingFocus } from "../../../hooks/useRovingFocus"
import { ReactNode, Suspense, useRef } from "react"
import { useAtomValue } from "jotai"
import clsx from "clsx"

import { PlatformInfoSelectorFamily } from "../../../jotai/platforms/selectors"
import { PlatformId } from "../../../types"

import "./index.css"

/**
 * One platform in the Data Packs / Image Packs modals: its name, then its
 * options side by side (Current first). Hidden when Current is its only
 * option, so only platforms with something to choose are listed.
 */
export const PackLane = ({
  platformId,
  children,
}: {
  platformId: PlatformId
  children: ReactNode
}) => {
  // One tab stop per platform; arrow keys move between its options
  const ref = useRef<HTMLDivElement>(null)
  const rovingFocus = useRovingFocus(ref, ".packs__option")
  return (
    <section className="packs__lane">
      <h3 className="packs__lane-title">
        <Suspense fallback={platformId}>
          <PlatformName platformId={platformId} />
        </Suspense>
      </h3>
      <div
        className="packs__options"
        role="radiogroup"
        ref={ref}
        {...rovingFocus}
      >
        {children}
      </div>
    </section>
  )
}

const PlatformName = ({ platformId }: { platformId: PlatformId }) => {
  const { platform } = useAtomValue(PlatformInfoSelectorFamily(platformId))
  return platform.name
}

/** One choice for a platform: what it would be, and where it's from. */
export const PackOption = ({
  label,
  selected,
  onSelect,
  children,
}: {
  /** Where it's from: "Current", or the pack (owner, repository, variant). */
  label: ReactNode
  selected: boolean
  onSelect: () => void
  children: ReactNode
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    className={clsx("packs__option", selected && "packs__option--selected")}
    onClick={onSelect}
  >
    <span className="packs__option-content">{children}</span>
    <span className="packs__option-label">{label}</span>
  </button>
)

/** A pack's name for its options, e.g. "owner / repository · variant". */
export const packLabel = ({
  owner,
  repository,
  variant,
}: {
  owner: string
  repository: string
  variant?: string
}) => `${owner} / ${repository}${variant ? ` · ${variant}` : ""}`
