import { ReactNode, Suspense, useState } from "react"
import "./index.css"

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
        onClick={() => setIsOpen((c) => !c)}
      >
        {renderIcon && renderIcon()}
        {title}
        {isOpen ? <ContractIcon /> : <ExpandIcon />}
      </div>
      {isOpen && (
        <div className="details__content">
          <Suspense>{children}</Suspense>
        </div>
      )}
    </div>
  )
}

const ExpandIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="1.5em"
      viewBox="0 -960 960 960"
      width="1.5em"
    >
      <path
        fill="currentColor"
        d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"
      />
    </svg>
  )
}

const ContractIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="1.5em"
      viewBox="0 -960 960 960"
      width="1.5em"
    >
      <path
        fill="currentColor"
        d="m296-345-56-56 240-240 240 240-56 56-184-184-184 184Z"
      />
    </svg>
  )
}
