import { ReactNode, startTransition, Suspense, useState } from "react"
import "./index.css"
import Icon from "../../ui/Icon"

type DetailsProps = {
  title: string
  children: ReactNode
  openByDefault?: boolean
  sticky?: boolean
  renderIcon?: () => ReactNode
}

export const Details = ({
  title,
  children,
  openByDefault = false,
  sticky = false,
  renderIcon,
}: DetailsProps) => {
  const [isOpen, setIsOpen] = useState(openByDefault)

  return (
    <div className="details">
      {/* A real button, so the section opens with the keyboard too */}
      <button
        type="button"
        className={`details__title ${sticky ? "details__title--sticky" : ""}`}
        aria-expanded={isOpen}
        onClick={() => startTransition(() => setIsOpen((c) => !c))}
      >
        {renderIcon && renderIcon()}
        {title}
        {isOpen ? <Icon icon="chevron-up" /> : <Icon icon="chevron-down" />}
      </button>
      {isOpen && (
        <div className="details__content">
          <Suspense>{children}</Suspense>
        </div>
      )}
    </div>
  )
}
