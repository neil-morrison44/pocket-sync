import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { getCurrentWebview } from "@tauri-apps/api/webview"
import Icon from "../ui/Icon"

import "./dropOverlay.css"

/**
 * Shows "Drop to install" while a .zip is dragged over the window. The drop
 * itself is handled by the backend, which then opens the zip install modal.
 */
export const ZipDropOverlay = () => {
  const [isDragging, setIsDragging] = useState(false)
  const { t } = useTranslation("zip_install")

  useEffect(() => {
    const unlisten = getCurrentWebview().onDragDropEvent(({ payload }) => {
      if (payload.type === "enter") {
        setIsDragging(
          payload.paths.some((path) => path.toLowerCase().endsWith(".zip"))
        )
      } else if (payload.type === "leave" || payload.type === "drop") {
        setIsDragging(false)
      }
    })
    return () => {
      unlisten.then((stop) => stop())
    }
  }, [])

  if (!isDragging) return null
  // On <body>, so it covers the sidebar too, whatever the layout's stacking
  return createPortal(
    <div className="zip-drop-overlay" aria-live="polite">
      <div className="zip-drop-overlay__frame">
        <Icon icon="download" size={48} />
        <strong className="zip-drop-overlay__title">{t("drop.title")}</strong>
        <span className="zip-drop-overlay__text">{t("drop.text")}</span>
      </div>
    </div>,
    document.body
  )
}
