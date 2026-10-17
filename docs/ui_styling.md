# UI styling guide

How Pocket Sync's UI is put together: the principles, the theme tokens and the shared components.

## Principles

1. Keep the character: hard edges and slants, pixel type for titles, the 3D Pocket and the playful details.
2. Colour is sparse and means something: the Analogue green for active, selected and update states, red for danger.
3. Consistency over one-offs: shared components and tokens, the same info box for every hint.
4. Keyboard first, readable widths, no drop shadows.

## How styling works today

- **Plain CSS, no framework.** There is no Tailwind, CSS-in-JS or CSS modules. Each component imports its own stylesheet next to it (`src/components/<name>/index.css`).
- **BEM class names**: `block__element--modifier`, e.g. `sidebar__item--active`. The `useBEM` hook (`src/hooks/useBEM.ts`) builds class strings from a block, an optional element and boolean modifiers.
- **PostCSS nesting** (`postcss-nesting` in `vite.config.ts`). Use `&:hover`, `& .child` and so on inside a rule.
- **Colours** all come from one theme file, `src/theme.css` (see [Theming](#theming)). `src/style.css` holds only global element styles.
- **Fonts**: Inter (UI) and a custom pixel font `GamePocket` (headings) from `src/font.css`.
- **Lint**: `stylelint-config-standard`. Its kebab-case `selector-class-pattern` rule clashes with BEM, so those warnings already show up across the codebase and can be ignored.
- **Layout**: `src/components/layout` renders a sticky sidebar and the active view. The `--sidebar-width` variable is set on `.layout` and used by fixed-position elements in `settings`, `plugins` and `about`.

## Theming

`src/theme.css` (imported first in `src/main.tsx`) holds the **theme blocks**, which set the semantic tokens, grouped by comment headers: surfaces (`--theme-background`, `--theme-surface`, `--theme-surface-hover`, `--theme-surface-sunken`, `--theme-border`), text, inverse, accents (`--theme-accent`, `--theme-accent-text`, `--theme-accent-foreground`, `--theme-danger`, `--theme-danger-text`, `--theme-warning`, `--theme-highlight`, `--theme-selection`) and sidebar. `:root` / `[data-theme="dark"]` is the default. Components use `--theme-*` directly (the older aliases like `--info-colour` are gone).

**Adding a theme:** copy the dark block, rename the selector to `:root[data-theme="<name>"]`, change the values (and `color-scheme`), and switch to it with `document.documentElement.dataset.theme = "<name>"`. Set the attribute on `<html>`.

**Styles:** `data-style` on `<html>` layers on top of the theme. `slanted` (default, shown as "Slanted") keeps the slanted edges; `modern` (shown as "Straight", so the two read as equals) sets `--slant: 0px` (straight edges) and overrides surface and text tokens for more contrast, per theme. Build shapes from `--shape-slant*` and colours from tokens, and both styles work without extra CSS.

**Layout & typography** tokens (`--radius-*`, `--space-*`, `--font-body`, `--font-display`) live in the same file, outside the theme blocks, because they don't change per theme.

Some colours are still hard-coded outside the theme, e.g. link colours and the overlay in `style.css`, and various component files. Move them into tokens as each area is redesigned.

## UI libraries

| Tool                                                           | Status                                                                                                                                                                                           | Notes                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Pixelarticons](https://pixelarticons.com) + GamePocket glyphs | installed                                                                                                                                                                                        | Always use the `Icon` component (`src/components/ui/Icon`) with a registered name, e.g. `<Icon icon="search" />` or `<Icon icon="analogue-logo" size={20} />`. Add new icons to its registry. Pixel icons default to 16px (24px is pixel-perfect). Glyph icons use `size` as their font size (20px is pixel-perfect). |
| [Radix Primitives](https://www.radix-ui.com/primitives)        | `react-accordion`, `react-dialog`, `react-dropdown-menu`, `react-popover`, `react-select`, `react-slider`, `react-slot`, `react-switch`, `react-tabs`, `react-toggle`, `react-tooltip` installed | Add other primitives one package at a time (`@radix-ui/react-dialog`, `-popover`, …), wrapped in a `src/components/ui` component and styled with BEM classes.                                                                                                                                                         |
| [shadcn/ui](https://ui.shadcn.com/)                            | **not installed**                                                                                                                                                                                | shadcn components need Tailwind. For now we copy its _look_ (spacing, radii, muted colours) in plain CSS on top of Radix. To adopt it fully, add Tailwind v4 with Preflight scoped or disabled so existing component CSS isn't reset, then add components with `npx shadcn add`.                                      |

## UI primitives

`src/components/ui/<Name>/` holds the shared building blocks: `Icon`, `Button` (themes `primary`, `secondary`, `tertiary`, `destructive`), `IconButton`, `Toggle`, `Switch`, `Select` (option groups, `searchable` combobox mode), `MultiSelect` (checklist with search and Select All / Clear All), `TextInput` (`code` variant), `SearchInput`, `PathField`, `Tabs`, `Tooltip`, `Popover`, `Menu` (a button that opens a list of actions, e.g. Jump to; it holds no value, unlike `Select`), `Stats`, `StickySection`, `Tag` / `TagList` (slanted status chips; themes `neutral`, `accent`, `warning`, `danger`, `highlight`, `analogizer`), `Accordion` / `AccordionItem` (expandable rows, e.g. release notes; `action` puts a button in the header row), `Kbd` (keyboard shortcut key caps that light up while held; `mod` is ⌘ on macOS, Ctrl elsewhere) and `Skeleton` / `CardSkeleton`, and `Tile` (the card for every grid of items: media, title, subtitle, meta, tags, optional actions; `orientation="horizontal"` for a small image beside the text, e.g. save states; `orientation="overlay"` for a photo gallery, where only the picture shows and the text appears on top of it on hover, e.g. screenshots; put it in a `Grid`). Document props with JSDoc comments. Each has `Name.tsx`, `Name.css` and `index.ts`, uses `clsx` with `--theme-*` / `--is-*` modifiers, and is built on a Radix primitive where one exists. Use these instead of raw `<button>`, `<select>` or `<input>` elements. The `Controls*` components in `src/components/controls` are thin wrappers around them for the top controls bar.

Shared pieces outside `ui/`: `shared/groupHeader` (the sticky heading of a group in a sectioned list, e.g. screenshots per game), `Link` with `subtle` for links that are titles (no underline until hovered), and `ControlsGroup` (sets off related controls, e.g. filters, with a dimmed vertical line). Lists that reload on file events keep showing their data with `keepPrevious` / `keepPreviousOrSuspend` (`utils/jotai.ts`) instead of falling back to skeletons. In development builds, Settings → Developer has previews for states that are hard to reach (core updates, loaders, the photo export and update progress modals).

## Conventions for new UI

- Text uses one of three levels: `--theme-text-headline` for titles, `--theme-text-body` for running text (the default), `--theme-text-soft` for dates and secondary info. Don't dim text with `opacity`.
- Settings that apply immediately use `Switch`; choices that need a separate save use a checkbox or `Toggle`. Actions that remove something use `<Button theme="destructive" icon="trash">`.
- Header bars (`Controls`): back button, search and filters first; actions inside `ControlsActions`, which sits on the right.
- Button labels are verb + noun ("Add Core", "Remove Plugin"). Icon-only buttons are `IconButton`s with a required `label` (tooltip + accessible name); never ship a button without a label.
- Keyboard focus uses `--theme-focus`; selection uses `--theme-selection`. Focus styles go under `:root.keyboard-focus` (set by `useKeyboardFocus`), so they only show for keyboard users.
- Hover lightens the background (`--theme-surface-raised`; tiles use `--theme-tile-hover`, the sidebar's colour in the slanted dark theme); never scale on hover. Press may scale to 0.97–0.99.
- Anything placed on the accent green (`--theme-accent`) uses `--theme-accent-text` for its text and icons. Green text, icons and borders on the page itself (links, check marks, frames) use `--theme-accent-foreground`: the Analogue green in dark, a darker green in light, where `#84E38F` on white is unreadable. Text on red (`--theme-danger`) uses `--theme-danger-text` (white in both themes).
- Never hard-code colours in component CSS. Use `--theme-*` tokens directly, or alias them on the block when a component needs its own names: `.sidebar { --sidebar-background: var(--theme-sidebar-background) }`.
- If a component needs a colour the theme doesn't have yet, add a `--theme-*` token to **every** theme in `src/theme.css`. Don't add a hex value to the component.
- Pages for one item (a core, a platform) use `DetailPage` (`components/shared/detailPage`): a back button floating on the banner, a header bar that slides in on scroll, `DetailHeading` (title and icon-button actions on one row, details below), and `DetailSection` / `DetailFacts` for the content.
- UI preferences that toggle with a transition use `atomWithAppLocalSetting` (it doesn't suspend after a write); other stored settings may use `atomWithAppLocalStorage`.
- On slanted shapes the focus ring sits on the edge (2px inward, `--shape-slant-ring`), since clip-path clips anything outside; in Straight it sits `--focus-offset` (2px) outside. On accent fills set `--focus-ring-colour: var(--theme-accent-text)`.
- Rows of controls use `--control-gap` (`--space-sm` minus `--slant`): two slanted edges side by side already look the slant further apart.
- Settings that should survive a restart use `atomWithAppLocalStorage` (a JSON file in the app data folder). Don't use `localStorage` / `atomWithStorage`; the webview doesn't keep it between launches.
- The page's main search is a `ControlsSearch`; it gets the ⌘F / Ctrl+F shortcut. Only one per screen.
- Every icon goes through `Icon`, including brand marks (e.g. the Analogizer), so `size` works the same for all. Icons inside text-sized elements (tags, key caps) use `<Icon size="text" />`, so they scale with the font.
- Pages use `--page-padding-inline` for their side padding, the same as the header bar, so content lines up with it.
- Separators under header bars and sticky section headers stop at `--page-padding-inline` (an inset `::after` line), they don't run edge to edge.
- Text colour defaults to `--theme-text-body`; only titles use `--theme-text-headline`. Settings: row titles are the one emphasised level, settings and their controls use the regular size (`--font-size-md`).
- Grids of items (cores, platforms, save states, palettes) use `Tile` inside `Grid`; don't build new card styles.
- `EmptyState fullPage` on pages without a header bar, so it centres in the window.
- The regular font size is 16px (`--font-size-md`); only header-bar controls (14px) and secondary text go smaller.
- `Tabs` wrap each tab in its own `Suspense`; a tab that loads data never suspends the page.
- Save state images use the Pocket screen's 10:9 aspect ratio.
- Colour choices show a swatch: `SelectOption.swatch` (any CSS colour).
- Forms use `Field` (label, control, hint or error) for every input, so each says what to enter, ideally with an example. Form modals use `className="modal--form"` and end with a `modal__actions` row: dismiss (tertiary) first, the main action (primary) last, disabled until the form is complete.
- Searchable lists sit in a `.search-results` wrapper ending with `<NoResults />`; it shows by itself when the search or filters leave nothing. Progress uses `ProgressBar` (or `ProgressLoader` for backend progress events).
- Tiles for items without a picture use `<span className="tile__icon"><Icon … /></span>` as `media`; running text goes in `description`.
- Platform images go through `PlatformImage` (SD card) or `InventoryPlatformImage` (online); both fall back to a placeholder in `--theme-surface`.
- Font sizes come from the scale in `theme.css`: `--font-size-2xs` (11px), `-xs` (12), `-sm` (14), `-code` (13), `-md` (16, body), `-lg` (18), `-xl` (20), `-title-sm` (24), `-title-md` (32), `-title-lg` (40), `-title-xl` (48), `-hero` (64). Never hard-code a rem / px size; em is fine for things that follow their surroundings.
- Pocket buttons and shortcuts are shown with `ButtonCombo` (`keys={["analogue", "start"]}`), never as text caps, except L / R, which have no glyph.
- The accent fill in both themes is `--analogue-green` (#84E38F); use `--theme-accent`, not the brand token, in components.
- Loading states use `Loader` (which renders `Spinner`, D-pad by default) or `Skeleton` for content placeholders; no other spinners.
- Page-level info notes can be dismissible: `Callout dismissId="area-topic"` (stable id); warnings tied to a setting shouldn't be.
- Notes next to settings or content use `Callout` (`variant="info"` grey, `"warning"` yellow). Empty pages use `EmptyState` (icon, title, text, action).
- Hints and warnings always use `Callout` (the info box; `variant="warning"` for warnings, `callout--in-page` for page-level ones), so they look the same everywhere. A set filter is marked (`Select active`; `MultiSelect` does it itself), and a `ControlsGroup` with `onClear` shows Clear Filters.
- Radii come from tokens: `--radius` (default, 2px) and `--radius-button`, `--radius-chip`, `--radius-card`, `--radius-input`, `--radius-modal`. Never hard-code a radius. Nested corners are concentric: a frame around rounded items gets the items' radius plus its padding (`--radius-popover` for dropdown lists and popovers; the tab frame is `--radius` + 3px). Slanted shapes use `--shape-slant`, which is rounded in the Modern style; there, 1px frames are inset box shadows that follow the radius instead of clip-path outlines, and tertiary buttons have no outline. Item height: 36px. Spacing: multiples of 4px.
- Every visible string goes through i18n (`react/jsx-no-literals`). Add new keys to `src/i18n/locales/en/index.json`. Other locales fall back to English.
- A modal component that loads data wraps itself in `ModalSuspense` (same title / onClose), so the modal and a loader show at once.
- Notification dots use `.notification-dot` (accent green, on a `position: relative` parent); sidebar items take a count badge (`sidebar__badge`).
- Modals (`components/modal`, Radix Dialog) always get a `title`. Pass `onClose` whenever the modal can be dismissed: it adds the close icon button and Escape. Leave it out (or pass `undefined` while busy) when it mustn't close. Don't add a separate "Close" button; "Cancel" next to a confirming action is fine.
- Use real `<button>`s for clickable elements, with `aria-current` / `aria-label` where needed and a `:focus-visible` outline.
