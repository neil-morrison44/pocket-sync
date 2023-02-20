import { listen } from "@tauri-apps/api/event"
import { useEffect, useMemo, useState } from "react"

export const useProgress = (onEnd?: () => void) => {
  const [messageLog, setMessageLog] = useState<string[]>([])
  const lastMessage = useMemo(() => {
    if (messageLog.length === 0) return null
    return messageLog[messageLog.length - 1]
  }, [messageLog])

  const [inProgress, setInProgress] = useState(false)
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const unlisten = listen<ProgressPayload>("progress-start-event", () => {
      setMessageLog([])
      setInProgress(true)
      setPercent(0)
    })
    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  useEffect(() => {
    const unlisten = listen<ProgressPayload>(
      "progress-event",
      ({ payload }) => {
        setMessageLog((bl) => [...bl, payload.message])
        setPercent(payload.progress)
      }
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  useEffect(() => {
    const unlisten = listen<ProgressPayload>("progress-end-event", () => {
      setInProgress(false)
      onEnd?.()
    })
    return () => {
      unlisten.then((l) => l())
    }
  }, [onEnd])

  return { messageLog, lastMessage, inProgress, percent }
}

type ProgressPayload = {
  message: string
  progress: number
}

type ProgressEndPayload = {}
