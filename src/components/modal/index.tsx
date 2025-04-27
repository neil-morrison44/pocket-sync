import { ReactNode, useEffect, useState } from "react"
import { WebviewWindow } from "@tauri-apps/api/webviewWindow"
import "./index.css"

import { mainWindowSelector } from "../../recoil/selectors"
import { useAtomValue } from "jotai"

type ModalProps = {
  children: ReactNode
  className?: string
}

export const Modal = ({ children, className }: ModalProps) => {
  const [wrapperHeight, setWrapperHeight] = useState(0)
  const mainViewWindow = useAtomValue(mainWindowSelector)

  useEffect(() => {
    if (!mainViewWindow) return

    mainViewWindow.innerSize().then(({ height }) => {
      setWrapperHeight(height / window.devicePixelRatio)
    })

    const unlisten = mainViewWindow.onResized(({ payload }) => {
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
