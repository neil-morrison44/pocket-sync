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
  const [startTime, setStartTime] = useState(0)

  const remainingTime = useMemo(() => {
    const currentTime = Date.now()
    const elapsedTimeMs = currentTime - startTime

    const estimatedTotalTimeMs = elapsedTimeMs / (percent / 100)
    const remainingTimeMs = estimatedTotalTimeMs - elapsedTimeMs
    const remainingTimeSec = Math.round(remainingTimeMs / 1000)

    const hours = Math.floor(remainingTimeSec / 3600)
    const minutes = Math.floor((remainingTimeSec % 3600) / 60)
    const seconds = remainingTimeSec % 60

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }, [startTime, percent])

  useEffect(() => {
    const unlisten = listen<ProgressPayload>("progress-start-event", () => {
      setMessageLog([])
      setInProgress(true)
      setPercent(0)
      setStartTime(Date.now())
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

  return { messageLog, lastMessage, inProgress, percent, remainingTime }
}

type ProgressPayload = {
  message: string
  progress: number
}
