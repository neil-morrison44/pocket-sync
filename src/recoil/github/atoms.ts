import { atom } from "recoil"

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

export const sponsorCountAtom = atom<number>({
  key: "sponsorCountAtom",
  default: getSponsorCount(),
  effects: [
    ({ setSelf }) => {
      const interval = setInterval(async () => {
        const newCount = await getSponsorCount()
        setSelf(newCount)
      }, INTERVAL_MINS * 60 * 1000)

      return () => clearInterval(interval)
    },
  ],
})
