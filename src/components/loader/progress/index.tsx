import { listen } from "@tauri-apps/api/event"
import { useEffect, useState } from "react"

import "./index.css"

type ProgressLoaderProps = {
  name: string
}

export const ProgressLoader = ({ name }: ProgressLoaderProps) => {
  const [percent, setPercent] = useState(0)

  const [message, setMessage] = useState<null | {
    token: string
    param?: string
  }>(null)

  useEffect(() => {
    const unlisten = listen<ProgressEvent>(
      `progress-event::${name}`,
      ({ payload }) => {
        setPercent(payload.progress * 100)
        if (payload.message) setMessage(payload.message)
      }
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [setPercent, name])

  return (
    <div className="progress-loader">
      <div
        className="progress-loader__bar"
        style={{ "--percent": `${percent}%` }}
      ></div>
      {message && `${message.token} - ${message.param}`}
    </div>
  )
}

type ProgressEvent = {
  finished: boolean
  progress: number
  message?: {
    token: string
    param?: string
  }
}
