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
      <div
        className={`details__title ${sticky ? "details__title--sticky" : ""}`}
        onClick={() => startTransition(() => setIsOpen((c) => !c))}
      >
        {renderIcon && renderIcon()}
        {title}
        {isOpen ? <Icon icon="chevron-up" /> : <Icon icon="chevron-down" />}
      </div>
      {isOpen && (
        <div className="details__content">
          <Suspense>{children}</Suspense>
        </div>
      )}
    </div>
  )
}
