# UI styling guide & redesign plan

The reasoning behind these choices, the character principles and the current status are in [redesign-plan.md](redesign-plan.md).

## How styling works today

- **Plain CSS, no framework.** There is no Tailwind, CSS-in-JS or CSS modules. Each component imports its own stylesheet next to it (`src/components/<name>/index.css`).
- **BEM class names**: `block__element--modifier`, e.g. `sidebar__item--active`. The `useBEM` hook (`src/hooks/useBEM.ts`) builds class strings from a block, an optional element and boolean modifiers.
- **PostCSS nesting** (`postcss-nesting` in `vite.config.ts`). Use `&:hover`, `& .child` and so on inside a rule.
- **Colours** all come from one theme file, `src/theme.css` (see [Theming](#theming)). `src/style.css` holds only global element styles.
- **Fonts**: Inter (UI) and a custom pixel font `GamePocket` (headings) from `src/font.css`.
- **Lint**: `stylelint-config-standard`. Its kebab-case `selector-class-pattern` rule clashes with BEM, so those warnings already show up across the codebase and can be ignored.
- **Layout**: `src/components/layout` renders a sticky sidebar and the active view. The `--sidebar-width` variable is set on `.layout` and used by fixed-position elements in `settings`, `plugins` and `about`.

## Theming

`src/theme.css` (imported first in `src/main.tsx`) has two layers:

1. **Theme blocks** set the semantic tokens, grouped by comment headers: surfaces (`--theme-background`, `--theme-surface`, `--theme-surface-hover`, `--theme-surface-sunken`, `--theme-border`), text, inverse, accents (`--theme-accent`, `--theme-danger`, `--theme-warning`, `--theme-highlight`, `--theme-selection`) and sidebar. `:root` / `[data-theme="dark"]` is the default.
2. **Aliases** map the older names (`--background-colour`, `--info-colour`, `--green-colour`, …) to theme tokens, so existing component CSS follows the active theme. New code should use `--theme-*` directly. Over time the aliases can be removed.

| Legacy alias | Theme token |
| --- | --- |
| `--background-colour` | `--theme-background` |
| `--hover-colour` | `--theme-surface-hover` |
| `--info-colour` | `--theme-surface-sunken` |
| `--light-colour` | `--theme-surface` |
| `--green-colour` | `--theme-accent` |
| `--red-colour` | `--theme-danger` |
| `--orange-colour` | `--theme-warning` |
| `--purple-colour` | `--theme-highlight` |
| `--selection-colour` | `--theme-selection` |

**Adding a theme:** copy the dark block, rename the selector to `:root[data-theme="<name>"]`, change the values (and `color-scheme`), and switch to it with `document.documentElement.dataset.theme = "<name>"`. Set the attribute on `<html>`: the aliases are resolved there, so they don't follow a theme set on a nested element.

**Styles:** `data-style` on `<html>` layers on top of the theme. `slanted` (default) keeps the slanted edges; `modern` sets `--slant: 0px` (straight edges) and overrides surface and text tokens for more contrast, per theme. Build shapes from `--shape-slant*` and colours from tokens, and both styles work without extra CSS.

**Layout & typography** tokens (`--radius-*`, `--space-*`, `--font-body`, `--font-display`) live in the same file, outside the theme blocks, because they don't change per theme.

**Figma:** each Figma variable stores its CSS variable as its web code syntax (e.g. `var(--theme-accent)`), so the mapping lives in Figma. When you add or rename a token, update the matching Figma variable by hand.

Some colours are still hard-coded outside the theme, e.g. link colours and the overlay in `style.css`, and various component files. Move them into tokens as each area is redesigned.

## Figma

The design lives in a Figma file (ask @olivierbrcknr for access).

- **Variables**
  - **Theme** (mode `Dark`) mirrors the `--theme-*` tokens. Every variable's web code syntax is its CSS variable.
  - **Layout** holds radius and spacing.
  - **Typography** holds `font/body` and `font/display`. Text styles bind their font family to these variables.
- **Text styles:** `Display/H1`, `Display/H2`, `Display/Small`, `Control/*`, `Body/*`, `Label/*`, `Caption/Medium`.
- **Components** (Components page → "Pocket Sync Components"):
  - Sidebar Item (State × Show Label)
  - Sidebar (Collapsed)
  - Button
  - Toggle (Checked)
  - Select
  - Search
  - Link Pill
  - Platform Image
  - Core Card
  - Game Card
  - News Item (Update/New)
  - Icons currently come from a Lucide set on the same page via instance swap; this is to be replaced with Pixelarticons to match the code.
- **Screens** (Page 1 → "Screens"): Pocket Sync, Games and Cores, built entirely from component instances.

To add a theme: add a mode to the Figma "Theme" collection and a matching `:root[data-theme="<name>"]` block in `theme.css`.

## UI libraries

| Tool                                                    | Status                              | Notes                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Pixelarticons](https://pixelarticons.com) + GamePocket glyphs | installed | Always use the `Icon` component (`src/components/ui/Icon`) with a registered name, e.g. `<Icon icon="search" />` or `<Icon icon="analogue-logo" size={20} />`. Add new icons to its registry. Pixel icons default to 16px (24px is pixel-perfect). Glyph icons use `size` as their font size (20px is pixel-perfect). |
| [Radix Primitives](https://www.radix-ui.com/primitives) | `react-tooltip`, `react-toggle`, `react-select`, `react-slot`, `react-switch`, `react-tabs` installed | Add other primitives one package at a time (`@radix-ui/react-dialog`, `-popover`, …), wrapped in a `src/components/ui` component and styled with BEM classes. |
| [shadcn/ui](https://ui.shadcn.com/)                     | **not installed**                   | shadcn components need Tailwind. For now we copy its _look_ (spacing, radii, muted colours) in plain CSS on top of Radix. To adopt it fully, add Tailwind v4 with Preflight scoped or disabled so existing component CSS isn't reset, then add components with `npx shadcn add`. |

## UI primitives

`src/components/ui/<Name>/` holds the shared building blocks: `Icon`, `Button` (themes `primary`, `secondary`, `tertiary`, `destructive`), `IconButton`, `Toggle`, `Switch`, `Select` (option groups, `searchable` combobox mode), `MultiSelect` (checklist with search and Select All / Clear All), `TextInput` (`code` variant), `SearchInput`, `PathField`, `Tabs`, `Tooltip`, `Popover`, `Stats`, `StickySection` and `Skeleton` / `CardSkeleton`. Document props with JSDoc comments. Each has `Name.tsx`, `Name.css` and `index.ts`, uses `clsx` with `--theme-*` / `--is-*` modifiers, and is built on a Radix primitive where one exists. Use these instead of raw `<button>`, `<select>` or `<input>` elements. The `Controls*` components in `src/components/controls` are thin wrappers around them for the top controls bar.

## Conventions for new UI

- Text uses one of three levels: `--theme-text-headline` for titles, `--theme-text-body` for running text (the default), `--theme-text-soft` for dates and secondary info. Don't dim text with `opacity`.
- Settings that apply immediately use `Switch`; choices that need a separate save use a checkbox or `Toggle`. Actions that remove something use `<Button theme="destructive" icon="trash">`.
- Header bars (`Controls`): back button, search and filters first; actions inside `ControlsActions`, which sits on the right.
- Button labels are verb + noun ("Add Core", "Remove Plugin"). Icon-only buttons are `IconButton`s with a required `label` (tooltip + accessible name); never ship a button without a label.
- Keyboard focus uses `--theme-focus`; selection uses `--theme-selection`. Focus styles go under `:root.keyboard-focus` (set by `useKeyboardFocus`), so they only show for keyboard users.
- Hover lightens the background (`--theme-surface-raised`); never scale on hover. Press may scale to 0.97–0.99.
- Anything placed on the accent green (`--theme-accent`) uses `--theme-accent-text` for its text and icons.
- Never hard-code colours in component CSS. Use `--theme-*` tokens directly, or alias them on the block when a component needs its own names: `.sidebar { --sidebar-background: var(--theme-sidebar-background) }`.
- If a component needs a colour the theme doesn't have yet, add a `--theme-*` token to **every** theme in `src/theme.css`. Don't add a hex value to the component.
- Radii: 6px for controls. Item height: 36px. Spacing: multiples of 4px.
- Every visible string goes through i18n (`react/jsx-no-literals`). Add new keys to `src/i18n/locales/en/index.json`. Other locales fall back to English.
- Use real `<button>`s for clickable elements, with `aria-current` / `aria-label` where needed and a `:focus-visible` outline.

## Redesign progress

Status, decisions and next steps are tracked in [redesign-plan.md](redesign-plan.md).
