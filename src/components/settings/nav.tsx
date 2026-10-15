import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { useRovingFocus } from "../../hooks/useRovingFocus"
import { useScrollSpy } from "../../hooks/useScrollSpy"

/**
 * Settings sections and their items in page order. Sections render as
 * `settings-section-{key}`, items as `settings-{item}`.
 */
export const SETTINGS_SECTIONS = [
  {
    key: "display",
    items: [
      "theme",
      "3d_pocket",
      "language",
      "hide_ai_score",
      "hidden_cores",
      "dismissed_notes",
    ],
  },
  {
    key: "downloads",
    items: [
      "archive",
      "turbo_downloads",
      "alternate_skip",
      "keep_platform_data",
      "github_token",
    ],
  },
  {
    key: "files",
    items: ["gb_palettes_conversion", "clear_file_cache", "logs"],
  },
  { key: "connection", items: ["reconnect", "disconnect"] },
] as const

/** In development builds the Developer section (demo tools) is listed too. */
const NAV_SECTIONS: readonly {
  key: string
  items: readonly string[]
}[] = import.meta.env.DEV
  ? [
      ...SETTINGS_SECTIONS,
      { key: "developer", items: ["demo_updates", "loading_preview"] },
    ]
  : SETTINGS_SECTIONS

const ITEM_IDS = NAV_SECTIONS.flatMap(({ items }) =>
  items.map((item) => `settings-${item}`)
)

/**
 * Section menu beside the settings (like VS Code's settings editor): jumps to
 * a section or item and highlights the one currently in view.
 */
export const SettingsNav = () => {
  const { t } = useTranslation("settings")
  const { active: activeId, jumpTo } = useScrollSpy(ITEM_IDS)
  const listRef = useRef<HTMLUListElement>(null)
  const rovingFocus = useRovingFocus(listRef, "button")

  const activeSection = NAV_SECTIONS.find(({ items }) =>
    items.some((item) => `settings-${item}` === activeId)
  )?.key

  return (
    <nav className="settings__nav" aria-label={t("sections")}>
      <ul className="settings__nav-list" ref={listRef} {...rovingFocus}>
        {NAV_SECTIONS.map(({ key, items }) => (
          <li key={key} className="settings__nav-section">
            <button
              type="button"
              className={`settings__nav-section-title ${
                activeSection === key
                  ? "settings__nav-section-title--active"
                  : ""
              }`}
              onClick={() =>
                jumpTo(`settings-${items[0]}`, `settings-section-${key}`)
              }
            >
              {t(`section_titles.${key}`)}
            </button>
            <ul className="settings__nav-items">
              {items.map((item) => {
                const id = `settings-${item}`
                const isActive = activeId === id
                return (
                  <li key={item}>
                    <button
                      type="button"
                      className={`settings__nav-item ${
                        isActive ? "settings__nav-item--active" : ""
                      }`}
                      aria-current={isActive ? "true" : undefined}
                      onClick={() => jumpTo(id)}
                    >
                      {t(`${item}.title`)}
                    </button>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  )
}
