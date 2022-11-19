import { ReactNode } from "react"

import "./index.css"

type ModalProps = {
  children: ReactNode
  className?: string
}

export const Modal = ({ children, className }: ModalProps) => {
  return (
    <div className="modal__wrapper">
      <div className={`modal ${className || ""}`}>{children}</div>
    </div>
  )
}
