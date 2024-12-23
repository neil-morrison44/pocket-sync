import { useEffect, useState } from "react"
import {
  RecoilValue,
  useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE,
} from "recoil"

export const useRecoilSmoothUpdates = <T, D>(
  atomOrSelector: RecoilValue<T>,
  fallback: D
): T | D => {
  const [smoothedValue, setSmoothedValue] = useState<T | D>(fallback)
  const loadable =
    useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE(atomOrSelector)

  useEffect(() => {
    const inner = async () => {
      const value = await loadable.toPromise()
      setSmoothedValue(value)
    }
    inner()
  }, [loadable])
  return smoothedValue
}

export const useRecoilSmoothUpdatesFirstSuspend = <T>(
  atomOrSelector: RecoilValue<T>
): T => {
  const loadable =
    useRecoilValueLoadable_TRANSITION_SUPPORT_UNSTABLE(atomOrSelector)
  const [smoothedValue, setSmoothedValue] = useState<T>(() => {
    if (loadable.state !== "hasValue") throw loadable.toPromise()
    return loadable.getValue()
  })

  useEffect(() => {
    const inner = async () => {
      const value = await loadable.toPromise()
      setSmoothedValue(value)
    }
    inner()
  }, [loadable])
  return smoothedValue
}
