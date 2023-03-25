import { useEffect, useMemo, useState } from "react"

export const TimeAgo = ({ since }: { since: number }) => {
  const timeAgoFormatter = useMemo(() => {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  }, [])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 500)

    return () => clearInterval(interval)
  }, [setNow])

  const timeText = useMemo(() => {
    const secondsDiff = Math.round((since - now) / 1000)
    if (secondsDiff < -60)
      return timeAgoFormatter.format(Math.ceil(secondsDiff / 60), "minutes")
    return "less than one minute ago"
  }, [now, since])

  return <span>{timeText}</span>
}
