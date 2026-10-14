import { ReactNode, Suspense, useState } from "react"
import * as RadixDialog from "@radix-ui/react-dialog"
import clsx from "clsx"
import { useTranslation } from "react-i18next"
import "./index.css"

import { Loader } from "../loader"
import IconButton from "../ui/IconButton"
import { PortalContainerContext } from "../ui/portalContainer"

type ModalProps = {
  children: ReactNode
  /** Shown in the modal's header and used as its accessible name. */
  title: ReactNode
  className?: string
  /**
   * Called by the close button (top right), Escape and clicks outside.
   * Without it the modal can't be dismissed, e.g. while installing.
   */
  onClose?: () => void
}

/**
 * The app's modal, on Radix Dialog: a title and a close button in the
 * header, focus kept inside, Escape or a click outside to close.
 */
export const Modal = ({ children, title, className, onClose }: ModalProps) => {
  const [content, setContent] = useState<HTMLDivElement | null>(null)
  const { t } = useTranslation("app")

  return (
    <RadixDialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose?.()
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="modal__overlay" />
        <RadixDialog.Content
          ref={setContent}
          className={clsx("modal", className)}
          aria-describedby={undefined}
          // Focus the dialog itself, not the close button, so its tooltip
          // doesn't open over the title
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            content?.focus()
          }}
          // Escape only closes the modal: it mustn't also reach the page's
          // Escape-to-go-back (React updates between listeners, so the modal
          // is already gone when that one checks)
          onEscapeKeyDown={(event) => {
            event.stopPropagation()
            if (!onClose) event.preventDefault()
          }}
          onInteractOutside={(event) => {
            if (!onClose) event.preventDefault()
          }}
        >
          <header className="modal__header">
            <RadixDialog.Title className="modal__title">
              {title}
            </RadixDialog.Title>
            {onClose && (
              <RadixDialog.Close asChild>
                <IconButton
                  icon="close"
                  label={t("close")}
                  theme="tertiary"
                  tooltipSide="bottom"
                  className="modal__close"
                />
              </RadixDialog.Close>
            )}
          </header>
          {/* Popovers and selects inside portal into the modal, so they
              stay above it and inside its focus trap */}
          <PortalContainerContext value={content}>
            <Suspense
              fallback={
                <Loader className="loader--no-background loader--grow" />
              }
            >
              {children}
            </Suspense>
          </PortalContainerContext>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

type ModalSuspenseProps = Omit<ModalProps, "children"> & {
  /** The modal component; it may suspend while it loads its data. */
  children: ReactNode
}

/**
 * Shows the modal (title, close button, a loader) right away while the
 * modal component inside loads, instead of the page's fallback.
 */
export const ModalSuspense = ({
  children,
  title,
  className,
  onClose,
}: ModalSuspenseProps) => (
  <Suspense
    fallback={
      <Modal title={title} className={className} onClose={onClose}>
        <Loader className="loader--no-background loader--grow" />
      </Modal>
    }
  >
    {children}
  </Suspense>
)
