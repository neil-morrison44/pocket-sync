import { useEffect, useState } from "react"
import { RecoilValue, useRecoilValueLoadable } from "recoil"

export const useRecoilSmoothUpdates = <T, D>(
  atomOrSelector: RecoilValue<T>,
  fallback: D
): T | D => {
  const [smoothedValue, setSmoothedValue] = useState<T | D>(fallback)
  const loadable = useRecoilValueLoadable(atomOrSelector)

  useEffect(() => {
    const inner = async () => {
      const value = await loadable.toPromise()
      setSmoothedValue(value)
    }
    inner()
  }, [loadable])
  return smoothedValue
}
