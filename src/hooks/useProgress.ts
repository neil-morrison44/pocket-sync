import { listen } from "@tauri-apps/api/event"
import { useEffect, useMemo, useRef, useState } from "react"
import { ProgressEvent } from "../types"

export const useProgress = (name: string, onEnd?: () => void) => {
  const [percent, setPercent] = useState(0)
  const [message, setMessage] = useState<null | {
    token: string
    param?: string
  }>(null)

  const [inProgress, setInProgress] = useState(false)
  const [startTime, setStartTime] = useState(() => Date.now())

  const remainingTime = useMemo(() => {
    const currentTime = Date.now()
    const elapsedTimeMs = currentTime - startTime

    const estimatedTotalTimeMs = elapsedTimeMs / (percent / 100)
    const remainingTimeMs = estimatedTotalTimeMs - elapsedTimeMs
    const remainingTimeSec = Math.round(remainingTimeMs / 1000)

    if (remainingTimeSec === Infinity || Number.isNaN(remainingTimeSec))
      return "?"

    const hours = Math.floor(remainingTimeSec / 3600)
    const minutes = Math.floor((remainingTimeSec % 3600) / 60)
    const seconds = remainingTimeSec % 60

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }, [startTime, percent])

  const hasStartedRef = useRef(false)

  useEffect(() => {
    const unlisten = listen<ProgressEvent>(
      `progress-event::${name}`,
      ({ payload }) => {
        setPercent(payload.progress * 100)
        if (payload.message) setMessage(payload.message)

        if (!hasStartedRef.current) {
          setInProgress(true)
          setStartTime(Date.now())
        }

        hasStartedRef.current = true

        if (payload.finished) {
          hasStartedRef.current = false
          setInProgress(false)
          onEnd?.()
        }
      }
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [setPercent, onEnd, name])

  return { message, inProgress, percent, remainingTime }
}
