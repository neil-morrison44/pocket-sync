import { CoreInfoJSON } from "../../types"

/**
 * Features a core can support, read from its `core.json` (installed or from
 * the inventory) and its name. The values are i18n keys under
 * `core_info:supports_items`.
 */
export const CORE_FEATURES = [
  "save_states_and_sleep",
  "dock",
  "dock_dac",
  "cartridges",
  "link_port",
  "analogizer",
] as const

export type CoreFeature = (typeof CORE_FEATURES)[number]

type Framework = CoreInfoJSON["core"]["framework"]

/** Each feature with whether the core supports it, in a fixed order. */
export const getCoreFeatures = (
  coreName: string,
  framework: Framework | undefined
): Record<CoreFeature, boolean> => ({
  save_states_and_sleep: Boolean(framework?.sleep_supported),
  dock: Boolean(framework?.dock?.supported),
  dock_dac: Boolean(framework?.dock?.analog_output),
  cartridges: (framework?.hardware?.cartridge_adapter ?? -1) !== -1,
  link_port: Boolean(framework?.hardware?.link_port),
  analogizer: coreName.endsWith("_Analogizer"),
})

/** Whether a core has every one of the required features. */
export const hasFeatures = (
  features: Record<CoreFeature, boolean>,
  required: CoreFeature[] | undefined
) => (required ?? []).every((feature) => features[feature])

/** The License filter: any core, only free ones, or only licensed ones. */
export type LicenseFilter = "all" | "free" | "license"

/**
 * The License and AI-ness filters, which match the tags on a core's tile.
 * `maxAi` is the highest acceptable AI-ness (0–1); null allows any.
 */
export const passesTagFilters = (
  { requiresLicense, aiScore }: { requiresLicense: boolean; aiScore: number },
  {
    license = "all",
    maxAi = null,
  }: { license?: LicenseFilter; maxAi?: number | null }
) => {
  if (license === "free" && requiresLicense) return false
  if (license === "license" && !requiresLicense) return false
  if (maxAi !== null && aiScore > maxAi) return false
  return true
}
