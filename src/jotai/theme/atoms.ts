import { atomWithAppLocalSetting } from "../../utils/jotai"

// Stored as files in the app's data folder like other app settings; the
// webview's localStorage isn't kept between launches

export type ThemePreference = "system" | "dark" | "light"

/** The chosen UI theme; dark is the default, like the black Pocket. */
export const themePreferenceAtom = atomWithAppLocalSetting<ThemePreference>(
  "ui_theme",
  "dark"
)

export type StylePreference = "slanted" | "modern"

/**
 * The UI style, independent of the colour theme: "slanted" has the device's
 * slanted edges, "modern" straight edges and more contrast, like the
 * Analogue site.
 */
export const stylePreferenceAtom = atomWithAppLocalSetting<StylePreference>(
  "ui_style",
  "slanted"
)
