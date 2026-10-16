import { LicenseFilter } from "../../components/cores/features"
import { atom } from "jotai"
import { atomWithAppLocalSetting } from "../../utils/jotai"
import { AICheckJSON, SortMode } from "../../types"
import type { CoreFeature } from "../../components/cores/features"
import { atomWithRefresh } from "jotai/utils"
import { withAtomEffect } from "jotai-effect"
import { startTransition } from "react"

const AI_CHECK_URL =
  "https://openfpga-library.github.io/openfpga-ai-check/ai_report.json"

const INTERVAL_MINS = 30

export const sortingOptionAtom = atom<SortMode>("name")

export const categoryFilterOptionAtom = atom<string>("All")

/** The Cores list's License filter (see `passesTagFilters`). */
export const licenseFilterOptionAtom = atom<LicenseFilter>("all")

/** The Cores list's AI-ness filter: the highest acceptable score, or null. */
export const aiFilterOptionAtom = atom<number | null>(null)

export const featureFilterOptionAtom = atom<CoreFeature[]>([])

/** A platform id, or "All". */
export const platformFilterOptionAtom = atom<string>("All")

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

/**
 * Development only (Settings → Developer): pretend a few installed cores
 * have an update, to preview the update UI. Nothing on the SD card changes.
 */
export const demoCoreUpdatesAtom = atomWithAppLocalSetting<boolean>(
  "dev_demo_core_updates",
  false
)

/**
 * Development only (Settings → Developer): pretend a newer firmware is out,
 * to preview the firmware update UI.
 */
export const demoFirmwareUpdateAtom = atomWithAppLocalSetting<boolean>(
  "dev_demo_firmware_update",
  false
)
