import { ReactNode, useEffect, useState } from "react"
import { WebviewWindow } from "@tauri-apps/api/window"
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
      setWrapperHeight(height)
    })

    const unlisten = mainWindow.onResized(({ payload }) => {
      setWrapperHeight(payload.height)
    })
    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  console.log({ wrapperHeight })

  return (
    <div className="modal__wrapper" style={{ height: `${wrapperHeight}px` }}>
      <div className={`modal ${className || ""}`}>{children}</div>
    </div>
  )
}
