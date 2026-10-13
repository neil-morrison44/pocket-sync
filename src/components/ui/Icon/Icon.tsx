import React, { SVGProps } from "react"

import clsx from "clsx"
import {
  Archive,
  Article,
  ArrowRight,
  Camera,
  Check,
  CheckboxOn,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ChevronsVertical,
  Circle,
  Clock,
  Code,
  ColorsSwatch,
  Copy,
  ChevronRight,
  Cpu,
  Download,
  Folder,
  FolderPlus,
  Gamepad,
  Gift,
  Github,
  Grid2x22,
  Home,
  Image,
  Key,
  Layout,
  Logout,
  MemoryStick,
  Pencil,
  Plug,
  Reload,
  Save,
  Search,
  SettingsCog,
  Tools,
  Trash,
  Upload,
  WarningDiamond,
} from "pixelarticons/react"

import { AnalogizerMark } from "./brand"

import "./Icon.css"

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element

// Names match the Pixelarticons file names, so they line up with the Figma
// library. Add icons here instead of importing from pixelarticons directly.
const PIXEL_ICONS = {
  archive: Archive,
  article: Article,
  "arrow-right": ArrowRight,
  camera: Camera,
  check: Check,
  "checkbox-on": CheckboxOn,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-up": ChevronUp,
  "chevrons-vertical": ChevronsVertical,
  circle: Circle,
  clock: Clock,
  code: Code,
  "colors-swatch": ColorsSwatch,
  copy: Copy,
  cpu: Cpu,
  download: Download,
  folder: Folder,
  "folder-plus": FolderPlus,
  gamepad: Gamepad,
  gift: Gift,
  github: Github,
  "grid-2x2-2": Grid2x22,
  home: Home,
  image: Image,
  key: Key,
  layout: Layout,
  logout: Logout,
  "memory-stick": MemoryStick,
  pencil: Pencil,
  plug: Plug,
  reload: Reload,
  save: Save,
  search: Search,
  "settings-cog": SettingsCog,
  tools: Tools,
  trash: Trash,
  upload: Upload,
  "warning-diamond": WarningDiamond,
} satisfies Record<string, IconComponent>

const BRAND_ICONS = {
  analogizer: AnalogizerMark,
} satisfies Record<string, IconComponent>

// Analogue Pocket icons built into the GamePocket font, drawn through its
// discretionary ligatures (https://github.com/mumchristmas/GamePocket-font).
const GLYPH_ICONS = {
  pocket: "@face00@",
  "pocket-face-neutral": "@face01@",
  "pocket-face-sleepy": "@face02@",
  dpad: "@dpad00@",
  "dpad-left": "@dpad01@",
  "dpad-right": "@dpad02@",
  "dpad-up": "@dpad03@",
  "dpad-down": "@dpad04@",
  "face-buttons": "@key00@",
  "face-button-left": "@key01@",
  "face-button-right": "@key02@",
  "face-button-up": "@key03@",
  "face-button-down": "@key04@",
  "analogue-button": "@key05@",
  button: "@key06@",
  "button-large": "@key07@",
  "button-large-outline": "@key08@",
  "analogue-logo": "@logo01@",
  "analogue-logo-circle": "@logo02@",
  "analogue-logo-circle-outline": "@logo03@",
  "power-led": "@power00@",
  "usb-c": "@power01@",
  "power-plug": "@power02@",
} satisfies Record<string, string>

export type IconOptions =
  | keyof typeof PIXEL_ICONS
  | keyof typeof BRAND_ICONS
  | keyof typeof GLYPH_ICONS

// Pixelarticons are drawn on a 24×24 grid with 1-unit pixels: 24 and 48 are
// pixel-perfect everywhere, 12 on 2× displays. Sizes in between keep sharp
// edges (crispEdges) but some pixel rows render a device pixel thicker.
// Glyph icons use `size` as their font size; GamePocket's pixels are 1/20 em,
// so 20 is pixel-perfect (and 10 on 2× displays).
export type IconSize = 12 | 16 | 20 | 24 | 48

export interface IconProps {
  icon: IconOptions
  /** Defaults to 16 for pixel icons and 20 (pixel-perfect) for glyph icons. */
  size?: IconSize
  className?: string
  /** Accessible name. Leave out for decorative icons next to visible text. */
  label?: string
}

const Icon = ({ icon, size, className, label }: IconProps) => {
  const a11y = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true as const }

  if (icon in GLYPH_ICONS) {
    return (
      <span
        className={clsx("icon", "icon--is-glyph", className)}
        style={{ fontSize: size ?? 20 }}
        {...a11y}
      >
        {GLYPH_ICONS[icon as keyof typeof GLYPH_ICONS]}
      </span>
    )
  }

  if (icon in BRAND_ICONS) {
    const BrandIcon = BRAND_ICONS[icon as keyof typeof BRAND_ICONS]
    return (
      <BrandIcon
        className={clsx("icon", "icon--is-brand", className)}
        focusable="false"
        {...a11y}
      />
    )
  }

  const PixelIcon = PIXEL_ICONS[icon as keyof typeof PIXEL_ICONS]
  return (
    <PixelIcon
      className={clsx("icon", className)}
      width={size ?? 16}
      height={size ?? 16}
      focusable="false"
      {...a11y}
    />
  )
}

export default React.memo(Icon)
