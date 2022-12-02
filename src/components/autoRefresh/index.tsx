import { useEffect } from "react"
import { useInvalidateInventory } from "../../hooks/invalidation"

const INTERVAL_MINS = 15

export const AutoRefresh = () => {
  const invalidateInventory = useInvalidateInventory()

  useEffect(() => {
    const interval = setInterval(() => {
      invalidateInventory()
    }, INTERVAL_MINS * 60 * 1000)

    return () => clearInterval(interval)
  }, [invalidateInventory])

  return null
}
