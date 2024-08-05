import { ReactNode, useEffect, useState } from "react"
import { WebviewWindow } from "@tauri-apps/api/webviewWindow"
import "./index.css"

type ModalProps = {
  children: ReactNode
  className?: string
}

export const Modal = ({ children, className }: ModalProps) => {
  const [wrapperHeight, setWrapperHeight] = useState(0)

  useEffect(() => {
    const mainWindow = WebviewWindow.getByLabel("main")
    if (!mainWindow) return

    mainWindow.innerSize().then(({ height }) => {
      setWrapperHeight(height / window.devicePixelRatio)
    })

    const unlisten = mainWindow.onResized(({ payload }) => {
      setWrapperHeight(payload.height / window.devicePixelRatio)
    })
    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  return (
    <div className="modal__wrapper" style={{ height: `${wrapperHeight}px` }}>
      <div className={`modal ${className || ""}`}>{children}</div>
    </div>
  )
}
