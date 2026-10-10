import { ReactNode, Suspense, useEffect, useRef, useState } from "react"
import "./index.css"

import { mainWindowSelector } from "../../jotai/selectors"
import { useAtomValue } from "jotai"
import { Loader } from "../loader"

type ModalProps = {
  children: ReactNode
  className?: string
}

export const Modal = ({ children, className }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog
      className={`modal ${className || ""}`}
      ref={dialogRef}
      closedby="none"
    >
      <Suspense fallback={<Loader />}>{children}</Suspense>
    </dialog>
  )
}
