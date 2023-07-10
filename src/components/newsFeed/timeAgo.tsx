import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

export const TimeAgo = ({ since }: { since: number }) => {
  const timeAgoFormatter = useMemo(() => {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  }, [])

  const [now, setNow] = useState(() => Date.now())
  const { t } = useTranslation("time_ago")

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
    return t("less_than_1_min_ago")
  }, [now, since, t, timeAgoFormatter])

  return <span>{timeText}</span>
}
