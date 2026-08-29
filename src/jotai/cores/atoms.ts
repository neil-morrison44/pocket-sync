import { atom } from "jotai"
import { AICheckJSON, SortMode } from "../../types"
import { atomWithRefresh } from "jotai/utils"
import { withAtomEffect } from "jotai-effect"
import { startTransition } from "react"

const AI_CHECK_URL =
  "https://openfpga-library.github.io/openfpga-ai-check/ai_report.json"

const INTERVAL_MINS = 30

export const sortingOptionAtom = atom<SortMode>("name")

export const categoryFilterOptionAtom = atom<string>("All")

const getAIInfo = async () => {
  const aiCheckResponse = await fetch(
    AI_CHECK_URL + `?cache_bust=${Date.now()}`
  )

  return (await aiCheckResponse.json()) as AICheckJSON
}

const aiCheckAtomBase = atomWithRefresh(async (_get) => await getAIInfo())

export const aiCheckAtom = withAtomEffect(aiCheckAtomBase, (_get, set) => {
  const interval = setInterval(
    () => {
      startTransition(() => set(aiCheckAtomBase))
    },
    INTERVAL_MINS * 60 * 1000
  )
  return () => clearInterval(interval)
})
