import * as RadixTabs from "@radix-ui/react-tabs"
import { useAtomValue } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useTranslation } from "react-i18next"
import { VIEWS_LIST } from "../../jotai/view/atoms"
import { useBEM } from "../../hooks/useBEM"
import { Loader } from "../loader"
import Icon, { IconOptions } from "../ui/Icon"
import Tooltip from "../ui/Tooltip"
import "./sidebar.css"

type View = (typeof VIEWS_LIST)[number]

const VIEW_ICONS: Record<View, IconOptions> = {
  "Pocket Sync": "pocket",
  Games: "gamepad",
  Cores: "cpu",
  Update: "reload",
  Screenshots: "image",
  Saves: "save",
  "Save States": "clock",
  Platforms: "grid-2x2-2",
  Palettes: "colors-swatch",
  Firmware: "memory-stick",
  Fetch: "download",
  Plugins: "plug",
  Settings: "settings-cog",
}

const NAV_GROUPS: View[][] = [
  ["Pocket Sync"],
  ["Games", "Cores", "Platforms", "Firmware"],
  ["Screenshots", "Saves", "Save States", "Palettes"],
  ["Update", "Fetch", "Plugins"],
]

const FOOTER_VIEWS: View[] = ["Settings"]

/** Tab value of the collapse toggle; the layout handles it as a toggle. */
export const SIDEBAR_TOGGLE_VALUE = "__toggle-sidebar"

export const sidebarCollapsedAtom = atomWithStorage(
  "pocket-sync:sidebar-collapsed",
  false
)

type SidebarProps = {
  view: View
  isPending: boolean
  /** Without a connection, every view except home is disabled. */
  connected: boolean
}

// The view list is the tab list of the layout's Radix Tabs root: arrow keys
// move between views, Enter/Space opens one (manual activation, so arrowing
// through doesn't load every screen).
export const Sidebar = ({ view, isPending, connected }: SidebarProps) => {
  const { t } = useTranslation("layout")
  const collapsed = useAtomValue(sidebarCollapsedAtom)
  const className = useBEM({ block: "sidebar", modifiers: { collapsed } })

  const renderItem = (v: View) => {
    const label = t(v.toLowerCase().replace(/\s/g, "_"))

    return (
      <Tooltip key={v} label={label} side="right" enabled={collapsed}>
        <RadixTabs.Trigger
          value={v}
          disabled={!connected && v !== "Pocket Sync"}
          className={`sidebar__item ${
            view === v ? "sidebar__item--active" : ""
          }`}
          aria-label={collapsed ? label : undefined}
        >
          <Icon className="sidebar__icon" icon={VIEW_ICONS[v]} />
          <span className="sidebar__label">{label}</span>
        </RadixTabs.Trigger>
      </Tooltip>
    )
  }

  const toggleLabel = t(collapsed ? "expand_sidebar" : "collapse_sidebar")

  return (
    <nav className={className}>
      <div className="sidebar__drag-region" data-tauri-drag-region />
      <RadixTabs.List className="sidebar__list" aria-label={t("views")}>
        <div className="sidebar__nav">
          {NAV_GROUPS.map((group, index) => (
            <div className="sidebar__group" key={index}>
              {group.map(renderItem)}
            </div>
          ))}
          {isPending && (
            <div className="sidebar__pending">
              <Loader className="loader--no-background" />
            </div>
          )}
        </div>

        <div className="sidebar__footer">
          {FOOTER_VIEWS.map(renderItem)}
          {/* A trigger, so arrow keys reach it with the views; the layout
              toggles the sidebar instead of switching views for this value */}
          <Tooltip label={toggleLabel} side="right" enabled={collapsed}>
            <RadixTabs.Trigger
              value={SIDEBAR_TOGGLE_VALUE}
              className="sidebar__item sidebar__item--muted"
              aria-label={toggleLabel}
              aria-expanded={!collapsed}
            >
              <Icon className="sidebar__icon" icon="layout" />
              <span className="sidebar__label">{toggleLabel}</span>
            </RadixTabs.Trigger>
          </Tooltip>
        </div>
      </RadixTabs.List>
    </nav>
  )
}
