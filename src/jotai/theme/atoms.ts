import { atomWithStorage } from "jotai/utils"

export type ThemePreference = "system" | "dark" | "light"

/** The chosen UI theme; dark is the default, like the black Pocket. */
export const themePreferenceAtom = atomWithStorage<ThemePreference>(
  "pocket-sync:theme",
  "dark"
)

export type StylePreference = "slanted" | "modern"

/**
 * The UI style, independent of the colour theme: "slanted" has the device's
 * slanted edges, "modern" straight edges and more contrast, like the
 * Analogue site.
 */
export const stylePreferenceAtom = atomWithStorage<StylePreference>(
  "pocket-sync:ui-style",
  "slanted"
)
