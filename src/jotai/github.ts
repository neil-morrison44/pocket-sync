import { atom } from "jotai"

const INTERVAL_MINS = 15

const getSponsorCount = async () => {
  try {
    const response = await fetch(
      `https://ghs.vercel.app/sponsors/neil-morrison44`
    )
    const { sponsors } = (await response.json()) as { sponsors: string[] }
    return sponsors.length
  } catch (err) {
    return 0
  }
}

const baseSponsorCountAtom = atom<null | number>(null)
export const sponsorCountAtom = atom<Promise<number>>(async (get) => {
  const baseCount = get(baseSponsorCountAtom)
  if (baseCount !== null) return baseCount

  const number = await getSponsorCount()
  return number
})

baseSponsorCountAtom.onMount = (setAtom) => {
  const interval = setInterval(async () => {
    const newCount = await getSponsorCount()
    setAtom(newCount)
  }, INTERVAL_MINS * 60 * 1000)
  return () => clearInterval(interval)
}
