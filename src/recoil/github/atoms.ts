import { withAtomEffect } from "jotai-effect"
import { atomWithRefresh } from "jotai/utils"
import { startTransition } from "react"

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

const baseSponsorCountAtom = atomWithRefresh(
  async (_get) => await getSponsorCount()
)

export const sponsorCountAtom = withAtomEffect(
  baseSponsorCountAtom,
  (_get, set) => {
    const interval = setInterval(async () => {
      startTransition(() => set(baseSponsorCountAtom))
    }, INTERVAL_MINS * 60 * 1000)

    return () => clearInterval(interval)
  }
)
