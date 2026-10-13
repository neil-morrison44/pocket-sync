import { ReactNode, Suspense, useEffect, useRef, useState } from "react"
import "./index.css"

import { mainWindowSelector } from "../../jotai/selectors"
import { useAtomValue } from "jotai"
import { Loader } from "../loader"
import { PortalContainerContext } from "../ui/portalContainer"

type ModalProps = {
  children: ReactNode
  className?: string
}

export const Modal = ({ children, className }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
    setDialog(dialogRef.current)
  }, [])

  return (
    <dialog
      className={`modal ${className || ""}`}
      ref={dialogRef}
      closedby="none"
    >
      <PortalContainerContext value={dialog}>
        <Suspense fallback={<Loader />}>{children}</Suspense>
      </PortalContainerContext>
    </dialog>
  )
}
