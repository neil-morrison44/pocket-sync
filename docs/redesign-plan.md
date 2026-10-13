# UI redesign — plan

Started 2026-10-13 on the fork branch `ob/redesign`. Status: **in progress.
Foundations, icons, UI primitives and two interaction/layout passes are done
in code and not yet committed (@olivierbrcknr's call, 2026-10-13). The firmware
picker, a by-system games list and a detailed Saves design session are
next. This PR is frontend-only; backend work (e.g. Eject) is a stretch goal.** See **Current status** below.

The goal is a cleaner, more consistent and more accessible Pocket Sync that
still looks and feels like an Analogue Pocket companion app, and that can be
merged upstream into `neil-morrison44/pocket-sync`.

## How to use this plan

This document is the single source of truth for the redesign across
sessions. Anyone (including a fresh Claude session) picking this up should:

1. Read **Current status** to see what's done, what's in progress and what's
   waiting on a decision.
2. Read **Character principles**. They are binding. Every visual change is
   checked against them.
3. Consult **Decisions (locked)** for constraints. Those are not to be
   re-litigated without a new reason. If a decision changes, revise it in
   place (see below), don't silently work around it.
4. Read the milestone marked in progress.
5. Use the **Page checklist** to see which screens are restyled and which
   @olivierbrcknr has reviewed.

How the styling works mechanically (tokens, file layout, BEM, Figma
variables) lives in [`ui_styling.md`](ui_styling.md). This plan says _why_
and _what's next_; that file says _how_.

**Keep it current.** Update this plan in the same change as the work it
describes:

- when a milestone finishes: mark it ✅, note anything left over, and move
  the "Next" pointer;
- when a milestone starts: list the concrete files being touched and any
  intermediate state;
- when a blocking question comes up: write it under "Waiting on" with what
  is needed from @olivierbrcknr;
- when a decision changes: edit its row in the decisions table, prefix it
  with **REVISED (date)**, keep the old decision in italics, and mention the
  change in Current status so it's discoverable;
- **whenever @olivierbrcknr explains why they want something, add it to Design
  rationale** below (dated, in his words as closely as possible). That
  section is the source for the reasoning in the PR description, so never
  skip it, even for small requests;
- **whenever an English string is added or reworded, update the other
  languages in the same change.** Touch only the keys this branch changed,
  match each locale's existing terms (e.g. Japanese and Vietnamese keep some
  view names in English), and skip a namespace a locale doesn't translate
  at all (it falls back to English as a whole). Check ICU plurals still
  parse.

Also keep [`ui_styling.md`](ui_styling.md) in sync when a change affects
tokens, conventions or the Figma file. Record only things that outlive this
initiative (preferences, environment quirks) in Claude's memory. Everything
about what's built and what's next belongs here.

## Current status

### Done

- ✅ **(a) Theme tokens.** `src/theme.css` is the single colour source;
  legacy variables are aliases. Layout and typography tokens are added.
  Controls, card images and About links use tokens. No visual change.
- ✅ **(b) Sidebar.** Grouped icon navigation, collapsible, tooltips,
  Pixelarticons icons.
- ✅ **(c) Figma foundations.** Variables (Theme / Layout / Typography), text
  styles, 11 components, and the Pocket Sync, Games and Cores screens are in
  the Figma design file.
  Left over:

  - The News Item component should hug its title; the fix was blocked by the
    Figma MCP rate limit.
  - `font/display` still uses the Silkscreen stand-in. Switch it to
    GamePocket in Figma by hand.

- ✅ **(d) Icons in code (2026-10-13).** `src/components/ui/Icon` with
  Pixelarticons (`pixelarticons/react`) plus brand marks. All 16 inline
  Material icons and the sidebar's Lucide icons are replaced; `lucide-react`
  is removed. Default size is 16px (24px was too large).
  Left over:
  - `src/components/update/emptyCheck.svg` (a CSS background) is untouched.
  - The Figma file still uses the Lucide library; swap it for Pixelarticons
    once the MCP limit allows.
  - Figma is also behind on the accent green, `accents/accent-text` and the
    slanted Sidebar Item. The update script is ready to run once the MCP limit
    resets.
  - GitHub now uses Pixelarticons' `github` icon. Other company icons
    (Discord, YouTube, Mastodon, …) come from Pixelarticons too.
  - Analogue Pocket-specific icons (D-pad, face buttons, Analogue logos,
    Pocket faces, power/USB-C) come from the GamePocket font's ligatures,
    exposed through the same `Icon` component (e.g. `analogue-logo`).
- ✅ **(e) UI primitives (2026-10-13).** `Button` (Radix Slot), `Toggle`
  (Radix Toggle), `Select` (Radix Select) and `SearchInput` in
  `src/components/ui/`. `ControlsButton`, `ControlsBackButton`,
  `ControlsCheckbox`, `ControlsSelect` and `ControlsSearch` now wrap them, and
  their old CSS is removed from `controls/index.css`.
  - Intended visual change: the Select list is now a styled popover with
    square corners instead of the OS-native menu.
  - Behaviour fix: buttons and toggles are real, keyboard-focusable
    elements with a visible focus ring.
  - Not yet checked in the running app (needs a connected Pocket for most
    screens).
- ✅ **Analogue look pass (2026-10-13).**

  - The accent is now the Analogue Pocket green `#63DB84`, with a new
    `--theme-accent-text` (#111) for text on it. The 7 places that put text on
    green now use it, because off-white on the lighter green was unreadable.
  - Sidebar items use the same slanted cut as the control buttons instead of
    rounded corners.

- ✅ **Interaction and layout pass (2026-10-13).**

  - Sidebar is a Radix vertical tab list (`layout/index.tsx` is the Tabs
    root, the content is the tab panel). Arrow keys move between views,
    Home/End jump, and Enter/Space opens one (manual activation).
  - Grids (`components/grid`) are one tab stop with spatial arrow-key
    navigation via `src/hooks/useRovingFocus.ts` and
    `src/utils/getSpatialNeighbor.ts` (ported from an earlier roving-tabindex implementation
    ProjectGallery). Enter/Space activates the card. The start screen's
    news list uses the same hook.
  - Focus rings on slanted elements are drawn inside the shape
    (`--shape-slant-ring`), because `clip-path` clipped the old ring.
  - `--content-max-width` (800px) caps Settings; other text-heavy screens
    follow as they're redesigned.
  - Start screen: library updates moved from the bottom strip into a
    vertical list on the right (`NewsFeed orientation="vertical"`; the
    connection screen keeps the horizontal strip).
  - Filter bar is compact: one row of 28px controls at 14px text, an inline
    "Filters" label, and a slanted search field (closes the 10px-radius
    check).
  - Settings checkboxes are `Switch`es (Radix Switch), because every one of
    them applies immediately.

- ✅ **Text levels (2026-10-13).** `--theme-text-headline` (full),
  `--theme-text-body` (84%, the default) and `--theme-text-soft` (53%),
  alpha-based. `--theme-text-muted` is replaced by
  soft. Applied to headings, the sidebar, the filter label, news-feed dates,
  save-state dates and saves info.
- ✅ **(j) Saves page (2026-10-13).** "Add backup location" has a
  `folder-plus` icon. Each backup location has a destructive "Remove" button
  (`trash` icon) and a "View saves" button, replacing a red text link and a
  CSS-drawn chevron. Square-cornered items; the list is capped at
  `--content-max-width`.

- ✅ **Second pass (2026-10-13).**

  - Home in the sidebar uses the GamePocket font's Pocket glyph.
  - Focus rings use a new `--theme-focus` token (the accent green), separate
    from selection blue.
  - `--content-max-width` is now 720px.
  - Header bars follow "search + filters ··· actions": `ControlsActions`
    pushes actions to the right on all 13 screens that have actions.
    Destructive actions (Uninstall Core, Delete Selected, Remove Coreless
    Platforms) use the destructive style with a bin icon.
  - Settings uses the primitives throughout: `Select` (with option groups)
    for the 3D colours, `TextInput` + `Button` for the archive URL and
    GitHub token, and `Button`s for cache, disconnect, logs and hidden
    cores. The missing `supreme_*` colours were added to `PocketColour`.
  - New primitives: `Tooltip` (one provider at the app root), `IconButton`
    (label required, shown as tooltip and accessible name), `TextInput`
    (`SearchInput` now wraps it) and `Tabs`.
  - Palettes are cards: preview and name open the palette, and an action
    row of `IconButton`s handles duplicate, copy code, rename and delete.
  - Start screen: the side panel has tabs for "Library Updates" and "What's
    new" (the changelog, formerly a modal). The sponsor link sits centred
    above the title, slanted instead of a pill.
  - Screenshots and Saves empty states are plain centred text instead of
    large pixel type.
  - English button labels rewritten as verb + noun (53 labels). Other
    languages still have the old wording and need updating before the PR.

- ✅ **Third pass (2026-10-13).**

  - Focus rings only show during keyboard use: `useKeyboardFocus` puts
    `keyboard-focus` on `<html>` on Tab or arrow keys and removes it on mouse
    down. Styles use `:root.keyboard-focus …:focus`; the
    browser's default outline is hidden otherwise.
  - Home layout: the title scales with its column
    (`clamp(2.5rem, 11cqi, 4rem)`) and has padding. Its `filter` paints only
    inside the box, which clipped GamePocket's overhanging glyphs until
    hover. Update banners are primary buttons. A tertiary "Eject SD Card"
    button sits centred below the 3D Pocket; it disconnects the folder in
    the app (`useDisconnectPocket`) but keeps the reconnect path.
  - Buttons have four themes: `primary` (green), `secondary` (light, the
    default), `tertiary` (outline) and `destructive` (red), via custom
    properties on one shared slanted block.
  - Motion: no scaling on hover anywhere; hover lightens the background
    (`--theme-surface-raised`), and press scales to 0.97–0.99.
  - Sidebar collapse: icons keep their position (collapsed width 57px),
    labels fade, and the content follows the animated width (About no
    longer uses `calc(100vw - …)`; fixed bars animate `left`).
  - Skeleton loaders (`Skeleton`, `CardSkeleton`) replace the grey loader
    blocks for core, game and platform cards and the grid's lazy-load
    placeholders.
  - Saves: each location is titled "Backup {number}", with the path and
    backup info below.

- ✅ **Fourth pass (2026-10-13).**

  - One app shell with or without an SD card: `App` always renders
    `Layout` with a `connection` (connected, connect handler, attempts).
    Disconnected, the sidebar shows with every view but Home disabled, and
    Home shows a randomised spinning Pocket and a primary "Connect to Pocket
    / SD Card" button where Eject sits. The separate connect screen and its
    `.container` / `.row` styles are gone.
  - "Saves" is called "Backups" in the sidebar. Backup paths are one
    truncated line (ellipsis at the start) with tertiary icon buttons to copy
    the path and open the folder.
  - Settings has a sticky section menu on the left (`settings/nav.tsx`,
    like VS Code): it jumps to a section, highlights the one in view, and is
    a keyboard tab group.
  - Start screen side panel: the pane owns the background; news items are
    transparent rows with dividers. Tabs are a framed segmented control with
    the active tab drawn like a secondary button. Tabs stay mounted once
    opened, so the changelog doesn't reload when switching.
  - An "article" icon button toggles the updates panel; the choice is saved
    (`atomWithStorage`, like the sidebar).
  - One `--slant` token drives every slanted shape, outline and focus ring.
    Tooltips are slanted too and appear after 100ms.
  - Icon-only tertiary buttons have no outline but keep the hover
    background.

- ✅ **Fifth pass (2026-10-13).**

  - Disconnected, the home view shows without the sidebar (decision #24
    revised).
  - The updates panel slides open and closed like the sidebar (width
    transition, fixed-width content, `inert` while closed).
  - The 3D Pocket sits in a fixed-size frame (`min(55vh, 520px)`), so the
    canvas only moves while the sidebar or panel animate; resizing it every
    frame made it jump.
  - Backups: the path is a framed, monospace, read-only field. The copy
    button shows a check and a "Copied" tooltip for a second, and icon
    buttons no longer shrink (32px in this row).
  - Window frame: `tauri.conf.json` sets `theme: "Dark"`,
    `titleBarStyle: "Transparent"` and `backgroundColor: "#1f1f1f"`, so the
    macOS title bar matches the sidebar (dark native title bar on Windows).
    Config only, no backend code.

- ✅ **(l) Firmware picker (2026-10-13).** A status card (installed
  version, firmware waiting on the SD card with a destructive Remove, or
  download progress) above a Radix Accordion of versions. Only the latest
  shows at first, expanded with its release notes and a primary "Load
  Firmware onto SD Card" button. "Show 10 Previous Versions" reveals more,
  and a "Jump to" select opens and scrolls to any version. Rows show date
  and Latest / Installed badges. Release notes load per row, with a
  skeleton.
- ✅ **(m) Games by system (2026-10-13).** `gameSystemsSelector` derives each
  system's games folder, game extensions and BIOS file names from the
  installed cores' data slots (the logic the per-core game counts used).
  The Games screen lists one section per system: name, manufacturer, game
  count, an Open Folder button, then the games with their subfolders.
  Search and the category filter apply to systems and games. The old
  per-core cards (`games/item.tsx`, `gameCount.tsx`) are removed.
- ✅ **Home title clipping, actual cause (2026-10-13).** `:root` sets a fixed
  `line-height: 24px`, so the 64px title's line box was far shorter than
  its glyphs, and the `filter` clipped them until hover enlarged the
  painted area. The title now has `line-height: 1.2`. Follow-up: global
  `h1`/`h2` inherit the same fixed line-height and would overlap when
  wrapping.

- ✅ **In-between commit (2026-10-13):** `b14e23f` on `ob/redesign`, not
  pushed. Personal data was checked before committing: no private paths,
  links or personal details in the repo.
- ✅ **Sixth pass (2026-10-13).**

  - No overscroll bounce (`overscroll-behavior: none`).
  - Settings: credits ("Thanks to") are a card at the very top instead of a
    fixed bottom bar, which also covered the end of the section menu. They
    now include the UI sources: Pixelarticons, Radix Primitives and the
    GamePocket icon glyphs. The nav no longer flashes on click:
    `useScrollSpy().jumpTo` highlights the target and ignores the sections
    scrolled past.
  - `Link` is a real `<a>` (keyboard-reachable). Links use the accent instead
    of the old blue.
  - Header bars sit on the page background with a light separator.
  - Library updates and "What's new" share one row style (body font, title,
    soft date, separators); library updates have a working hover.
  - Blue is gone: `--theme-selection` is the accent green (with
    `--theme-selection-text`), Select highlights are grey hovers, text
    selection is green, and the MiSTer sync indicator uses orange.
  - Plain `<button>`s (mostly in modals) look like a secondary `Button`, via
    a zero-specificity `:where(button:not([class]))` rule; classed legacy
    buttons keep their look until migrated.
  - Save-state names: decoded strictly as UTF-8, falling back to
    Windows-1252, then NFC-normalised, so accents like "é" show correctly.
  - Keyboard: the main view (tab panel) and `Tabs` content are no longer tab
    stops; the sidebar's collapse toggle is part of the arrow-key list.
  - Update: the warning-style overview is an info card with three figures.
  - Home: the 3D Pocket keeps the same tree with or without an SD card
    (`ColourContextProviderAuto`), so connecting no longer reloads it; the
    app version is small in the bottom-right corner.
  - Sidebar: a device summary (firmware version) below the home entry.
    _Removed again 2026-10-13: the firmware version is on the home stats._
  - macOS: overlay title bar (`titleBarStyle: "Overlay"`, hidden title); the
    traffic lights sit in the sidebar (`--titlebar-inset`, set by a
    `platform-macos` class). The sidebar top, header bars and home toolbar
    drag the window (`core:window:allow-start-dragging`).
  - Light theme and a theme setting (System / Dark / Light, default Dark).
    Old screens still have hard-coded colours that don't adapt yet.
  - Translations: every static `t()` key exists in English. _Updated
    2026-10-13: the other languages are translated too (see below)._

- ✅ **(p) "My Pocket" home, first part (2026-10-13).** A "Colours" button
  beside Eject (moved from the toolbar, so it reads as the Pocket's, not the
  app's) opens a `Popover` with the body and button colour
  selects (saved to the config, shared options in
  `settings/colourOptions.ts`). Below the 3D Pocket, a `Stats` row shows the
  installed firmware, cores and games (`installedGamesCountSelector`, same
  filtering as the Games screen via `filterGameFiles`). The Update overview
  uses the same `Stats` component. Still open: SD card usage (no disk-space
  call exists; needs backend) and play time (unknown whether the Pocket
  stores it).
- ✅ **(o) Combobox (2026-10-13).** `Select` has a `searchable` mode
  (Ariakit Combobox inside Radix Select, the pattern from Ariakit's docs):
  a search field filters options while keeping the selected one rendered.
  The category filters on Cores and Games use it.
- ✅ **Colour token sweep (2026-10-13).** 54 hard-coded colours in older
  screens now use tokens (frames → text colour, dividers → separator, white
  tints → overlay, image backgrounds → media, orange → warning), so they
  follow the light theme too. Intentionally kept: the Analogizer brand blue,
  dark shadows and backdrops, decorative gradients, and the plugin window's
  light frame. Unused Vite template styles (`.logo`, `app.css`) removed.

- ✅ **(f) Dialogs and popovers (2026-10-13), revised.** The modal stays a
  native `<dialog>` with `showModal()` (focus trap, top layer and a11y
  built in; no modal takes a close callback, so Radix Dialog would add risk
  for little gain). It's restyled: square corners, separator frame, softer
  backdrop. Popups inside a modal render into the dialog via
  `PortalContainerContext` (`ui/portalContainer.ts`), so they aren't hidden
  behind its top layer. `ControlsPopoverButton` (Update filters) now uses
  the Radix-based `Popover` instead of the experimental popover / anchor
  APIs.
- ✅ **Backups and reconnect path (2026-10-13).** The Backups list uses the
  full width. The "Reconnect when the app is opened" path is a `PathField`
  (copy, open folder) below its description instead of an inline `<pre>`,
  which overflowed the settings column and glitched while the sidebar
  animated. The translated description keeps its key; its path placeholder
  renders empty.
- **Next for modals (2026-10-13):** the app's own modals should move to
  Radix Dialog eventually, so they get a close button, Escape and an
  `onClose` contract. Native OS dialogs (`ask` / `confirm` / `message` /
  `open` from the Tauri dialog plugin) stay native.

- ✅ **Translations (2026-10-13).** The 54 relabelled and 48 new English
  strings are translated into bg, de, es, fr, ja, pt, tr, vi and zh, only
  for keys this branch touched. Skipped where a locale doesn't translate the
  namespace at all: the Update screen (`update`, English in every locale)
  and most of Turkish. "Saves" → "Backups" follows each locale's backup
  wording (e.g. de "Sicherungen", zh "备份").
- ✅ **Collapsed sidebar on macOS (2026-10-13).** It was narrower than the
  traffic lights. `--sidebar-collapsed-width` is 57px, 78px on macOS; the
  collapsed sidebar centres its icons in that width.
- ✅ **Update filters (2026-10-13).** New `MultiSelect` primitive (Radix
  Popover with a checklist; lists over 8 items get an Ariakit combobox
  search; footer with Select All / Clear All). Author, category and other
  filters use it. It replaces the unlabelled, empty-looking "toggle all"
  row.

- ✅ **Modern style (2026-10-13).** A second style next to the theme:
  Settings → Theme → Style, "Slanted" (default) or "Modern".
  `data-style="modern"` on `<html>` sets `--slant: 0px`, so every slanted
  edge becomes straight, and raises contrast (near-black / white surfaces,
  stronger separators, brighter text levels) in dark and light. Fonts,
  icons and layout are unchanged. Both stay until @olivierbrcknr decides.
- ✅ **Page checklist (2026-10-13).** See **Page checklist** below: every
  screen, sub-page, panel and modal, with how far each is restyled.

### In progress

- Nothing.

### Next

- (n) Resizable sidebar and side panel (split panes).
- (h) Migration and clean-up.
- (f2) Modals on Radix Dialog, with a close button (see below).
- Stretch: (k) Eject.

### Waiting on

- Committing: only when @olivierbrcknr asks. `b14e23f` is the in-between
  commit; later work is uncommitted. Never push, and no AI attribution in
  commit messages.
- Figma MCP call limit (Starter plan) for the remaining Figma work (g).

## Page checklist

A complete list of what the app shows, so no screen, sub-page or modal is
forgotten. Tick an item (`[x]`) once @olivierbrcknr has reviewed it, in
both styles (Slanted and Modern) and both themes (dark and light). Put
adjustments under **Review notes**. Add anything missing as soon as it's
found.

The tag after each item says how far it's restyled:

- **restyled**: uses the theme tokens and the `ui/` primitives;
- **partly**: some parts still use the old markup;
- **tokens only**: colours follow the theme, but buttons, inputs and layout
  are still the old ones ((h) migrates them);
- **native**: drawn by the OS (Tauri dialog plugin); can't be styled.

### App shell

- [ ] Sidebar, expanded and collapsed (incl. macOS traffic lights, pending
      spinner, disabled views without SD card): restyled
- [ ] Window title bar and drag areas (macOS overlay; Windows / Linux
      native): restyled
- [ ] Tooltips, popovers, selects, multi-selects, switches, toggles:
      restyled
- [ ] Keyboard focus rings (Tab through each screen): restyled
- [ ] Loading skeletons and the full-screen loader: partly
- [ ] Error screen (error boundary, stack trace, repair buttons): tokens
      only
- [ ] App self-update prompt: native

### Home (Pocket Sync)

- [ ] Without SD card: 3D Pocket spinning, Connect, "not a Pocket" tip:
      restyled
- [ ] Connected: 3D Pocket with screenshots, stats row, Colours popover,
      Eject, version: restyled
- [ ] Firmware / app update banners: partly
- [ ] Side panel: Library Updates tab, What's New (changelog) tab,
      show / hide: restyled

### Games

- [ ] Games by system, search, category filter: restyled
- [ ] Empty state (no games): restyled
- [ ] Modal: Move MROM Dumps: tokens only
- [ ] Modal: Clean Up Files: tokens only
- [ ] Modal: Build Instance JSON: tokens only

### Cores

- [ ] Cores list (cards, search, category filter, Analogizer badge,
      hidden cores): restyled
- [ ] Core detail, not installed (info, platform, releases, sponsor links,
      Install): partly
- [ ] Core detail, installed (version, Update, Uninstall, display modes,
      AI report, download counts, Analogizer / JT Analogizer section):
      partly
- [ ] Install older version picker: tokens only
- [ ] Required files list: tokens only
- [ ] Modal: Load Required Files (incl. its loading state): tokens only
- [ ] Modal: Inputs: tokens only
- [ ] Modal: Settings (core settings): tokens only
- [ ] Modal: zip install progress and replace prompt (installing a single
      core): tokens only

### Update

- [ ] Overview stats, filters (Author, AI-ness, Category, Other), list:
      restyled
- [ ] Install / update split buttons: restyled
- [ ] Modal: update progress (download phases, 3D scene, per-core
      prompts, finished report): tokens only
- [ ] Skip warnings and missing-archive confirmation: native

### Platforms

- [ ] Platforms list, Manage Data Packs / Image Packs, Remove Coreless
      Platforms: tokens only
- [ ] Platform detail (editable fields, cores for the platform): tokens
      only
- [ ] Modal: Manage Data Packs: tokens only
- [ ] Modal: Manage Image Packs: tokens only
- [ ] Modal: Image editor (stamps, import): tokens only
- [ ] Delete confirmation: native

### Firmware

- [ ] Installed firmware, version list, release notes accordion:
      restyled
- [ ] Download message: native

### Screenshots

- [ ] Screenshots grid, search, select mode, multi-export: tokens only
- [ ] Empty state: tokens only
- [ ] Screenshot detail (save, share, upscaled toggle): tokens only

### Backups (Saves)

- [ ] Backup locations list, Back Up Now, Add Backup Location, path field:
      restyled
- [ ] Empty state: restyled
- [ ] Backup detail (save files, versions per file, restore): tokens only
- [ ] MiSTer Sync: login, sync view, log: tokens only
- [ ] Modal: Save Mapping: tokens only
- [ ] Delete / restore confirmations: native

### Save States

- [ ] Save states grid, search, selection, delete: tokens only
- [ ] Modal: Game Boy Camera photo export (colours, single / all):
      tokens only
- [ ] Delete confirmation: native

### Palettes

- [ ] Palettes list (cards, share code, rename, duplicate, delete):
      restyled
- [ ] New palette / palette editor (colour inputs, save, reset): tokens
      only
- [ ] Modal: Add Palette via Code: tokens only
- [ ] Modal: Browse Palette Town: tokens only

### Fetch

- [ ] Fetch list (sources, status, Fetch Files, remove): tokens only
- [ ] Modal: Add Fetch Source (types, folder picker, extensions): tokens
      only
- [ ] Remove confirmation: native

### Plugins

- [ ] Plugins list, refresh, remove: tokens only
- [ ] Modal: Add plugin: tokens only
- [ ] Plugin window (separate window, own light frame): tokens only
- [ ] Remove / exit confirmations: native

### Settings

- [ ] Section menu, sticky sections, Thanks card: restyled
- [ ] Display: theme, style, 3D Pocket colours, language, AI score,
      hidden cores list: restyled
- [ ] Downloads: archive URL, turbo downloads, alternate assets, platform
      data, GitHub token: restyled
- [ ] Files: GB palettes conversion, file cache, logs: restyled
- [ ] Connection: reconnect path field, disconnect: restyled

### Review notes

- (none yet)

## Character principles (locked)

Pocket Sync is the companion app to the Analogue Pocket, and its look comes
from that device: precise industrial edges, a matte body, a pixel display and
pixel type. The redesign keeps that identity. These principles override
general "modern UI" defaults, including shadcn and Lucide styling.

1. **Edges, not soft curves.**
   - Hard corners and angled cuts are the signature, like the
     parallelogram-cut control buttons (`clip-path` slants).
   - Keep radii small and rare. Never default to pill or `rounded-lg`
     shapes.
   - Sidebar items, the search field and switches share the controls'
     slanted cut (2026-10-13). One shape token (`--shape-slant`) and one
     focus ring (`--shape-slant-ring`) serve all of them.
2. **Pixel type for display.** GamePocket stays for titles, section headings
   and news-feed titles. It is never replaced with a generic display face.
   Inter is only for UI text.
3. **Solid, edgy icons.** Icons have weight and crisp joins, matching the
   current Material-derived set's chunkiness. Thin, rounded, generic stroke
   icons don't fit.
4. **Device-like surfaces.** Dark, matte greys like the Pocket's body.
   Colour is sparse and means something. The accent is the **Analogue Pocket
   green `#63DB84`**, used for active and update states, always with dark
   text on top. Blue is for selection, red for danger.
5. **Keep the playful details.** The 3D Pocket on the home screen, the
   RGB-split title hover and the cartridge-like core cards are part of the
   charm and stay unless deliberately redesigned.
6. **Improve, don't genericise.** Structure, consistency, keyboard access
   and theming improve. Library defaults are always restyled to these
   principles before shipping.
7. **Keyboard first.** Every list or grid of similar items is one tab stop
   that you move through with arrow keys (a tab group / roving tabindex).
   Focus is always visible.
8. **Readable widths.** Text-heavy content is at most `--content-max-width`
   (800px). Tiled grids may use the full width, since their text blocks
   don't span the screen.

When a change can't satisfy a principle, note the trade-off here.

### Visual reference

**[analogue.co/pocket](https://www.analogue.co/pocket)** is the reference for
layout and presentation, alongside the device itself. Cues to borrow where a
screen fits them:

- Large, full-bleed product imagery alternating with short text blocks.
- Product-code labels like `AP_01`, technical drawings and spec-sheet lists:
  a precise, engineered feel instead of decorative chrome.
- Restrained copy and generous spacing; a single green accent.

The page's styling couldn't be read automatically. Compare against the live
site or screenshots when designing a screen, and note concrete decisions
here.

## Decisions (locked)

| #   | Question                            | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | How is the redesign delivered?      | **Small, reviewable steps on `ob/redesign`**, aimed at an upstream PR. Foundation steps must not change how screens look; visual changes are separate, labelled steps. Upstream's `nm/redesign` (one commit, Oct 2023, ~300 behind `main`) is stale and won't conflict.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2   | Tailwind / shadcn?                  | **No. Plain CSS + BEM + `postcss-nesting` stays.** Tailwind's Preflight reset would restyle every existing screen, and running two styling systems is too much to ask of an upstream reviewer. shadcn and Radix serve as references for structure and behaviour only (see principle 6).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 3   | Where do colours live?              | **`src/theme.css`, as semantic `--theme-*` tokens per theme block** (`:root`, `:root[data-theme="<name>"]`, switched on `<html>`). Legacy names (`--green-colour`, …) are aliases so existing CSS follows themes unchanged. Radius, spacing and font tokens live in the same file, outside the theme blocks. Hard-coded colours move into tokens as each area is touched.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 4   | How do Figma and code stay aligned? | **Figma's Theme / Layout / Typography variables mirror `theme.css` one-to-one**, with web code syntax `var(--…)`. A Figma mode equals a `data-theme` block. Tokens are kept in sync by hand; one-off helper scripts (like the token export used for the first Figma import) are not committed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 5   | How are components built?           | **`src/components/ui/<Name>/` per component, on Radix primitives where Radix has one** (Toggle, Select, Dialog, Popover, Tooltip, Slot). Structure follows a conventional design-system layout: `Name.tsx` + `Name.css` + `index.ts`, default export with exported prop and theme types, `clsx` with BEM `--theme-*` / `--is-*` modifiers, `React.memo` / `forwardRef` with `displayName`, `* as RadixX` imports. Existing `Controls*` components are re-implemented on the primitives first, so call sites keep working.                                                                                                                                                                                                                                                                                                                                                           |
| 6   | Icons                               | **REVISED 2026-10-13: Pixelarticons (MIT, 24px pixel grid) for UI and company icons, plus the GamePocket font's ligature glyphs for Analogue Pocket icons, through one `Icon` component with a fixed name registry. Default size 16px**: 24px is pixel-perfect but too large next to the UI text, and in-between sizes stay sharp via `crispEdges`. Its pixel grid matches GamePocket and the handheld (principles 2 and 3). Phosphor Bold, Remix Line and Material Symbols were compared and rejected. Only marks neither source covers (Analogizer) stay custom SVGs. An inline SVG is deleted only after its replacement has been reviewed. Where Pixelarticons lacks an icon, pick the closest pixel icon (e.g. `tools` for repair); never mix in another set. _Was: Lucide everywhere. Its thin, rounded strokes read as generic next to the pixel type and slanted controls._ |
| 7   | Sidebar                             | **Icon + label rows with the controls' slanted cut, grouped** (Home / library / media and data / tools), with Settings pinned at the bottom. Collapsible to icons only, with Radix tooltips; the collapsed state is saved via jotai `atomWithStorage`. `--sidebar-width` is a token, not measured. New strings exist in English only; other locales fall back to it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 8   | Typography                          | **Inter for UI, GamePocket for display**, exposed as `--font-body` / `--font-display`. Figma text styles bind their family to matching variables. The Figma MCP can't use local fonts, so Figma uses Silkscreen as a stand-in until switched by hand.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 9   | Accent colour                       | **Analogue Pocket green `#63DB84`** (`--theme-accent`), replacing `#589050`. Anything placed on it uses `--theme-accent-text` (#111): off-white text on the lighter green is about 1.6:1 contrast, dark text about 11:1.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 10  | Keyboard navigation                 | **Lists and grids are tab groups with a roving tabindex.** Sidebar: Radix Tabs (vertical, manual activation, so arrowing doesn't load every screen). Grids and other lists: `useRovingFocus` + `getSpatialNeighbor`, ported from an earlier implementation, because arrow keys must follow the visual layout of a wrapping grid and items may be lazily rendered or filtered out. `react-roving-tabindex` was considered; the in-house hook handles spatial grids and DOM-filtered items without extra wiring.                                                                                                                                                                                                                                                                                                                                                                      |
| 11  | Content width                       | **`--content-max-width: 800px`** for text-heavy views (Settings first, then Saves, Firmware, core info…). Tiled grids are exempt.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 12  | Checkbox vs switch                  | **Settings that apply immediately use `Switch`**; checkboxes or `Toggle`s are for choices that need a separate save or submit, or for filters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 13  | AI disclosure                       | **The upstream PR (and any other public write-up) states that AI (Claude Code) was used to help with the redesign**: what it did (code, docs, translations) and that every change was directed and reviewed by @olivierbrcknr. Translations get their own note, because @olivierbrcknr can't check every language.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 14  | Text colours                        | **Three levels from one colour with alpha:** headline (100%), body (84%, default), soft (53%, dates and secondary info). Use these instead of ad-hoc `opacity` on text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 15  | Scope                               | **REVISED 2026-10-13: this PR is frontend-only.** It does not touch backend code in `src-tauri`; the only exception is window styling in `tauri.conf.json`. Features that need new backend commands (e.g. ejecting the SD card volume) are stretch goals for a follow-up.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 16  | Focus colour                        | **`--theme-focus`** (the accent green) for every keyboard focus ring, separate from `--theme-selection` (blue), which marks selected items.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 17  | Header bars                         | **Search and filters on the left, actions on the right** (`ControlsActions`). Destructive actions use `theme="destructive"` with the `trash` icon.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 18  | Button labels                       | **Verb + noun**, e.g. "Add Core", "Remove Plugin", "Back to Cores". Dialog dismiss buttons ("Close", "Cancel") may stay short, because the dialog names the subject. A button never lacks a label: icon-only buttons use `IconButton`, whose label is the tooltip and accessible name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 19  | Focus visibility                    | **Focus rings only for keyboard users** (`useKeyboardFocus`, `:root.keyboard-focus`), not after mouse clicks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 20  | Motion                              | **No scaling on hover**; hover lightens the background. Press may scale slightly (0.97–0.99).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 21  | Button hierarchy                    | **`primary` (green) → `secondary` (light, default) → `tertiary` (outline) → `destructive` (red).** One primary action per view at most.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 22  | Loading                             | **Skeletons shaped like the content** for lists and grids, instead of grey blocks or spinners.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 23  | Slant                               | **One `--slant` token** (5px) defines every slanted edge; `--shape-slant`, `--shape-slant-outline` and `--shape-slant-ring` derive from it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 24  | App shell                           | **REVISED 2026-10-13: the same home view with or without an SD card, but no sidebar while disconnected.** Home offers Connect instead of Eject. _Was: the sidebar showed with every view but Home disabled._                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 25  | Naming                              | **"Saves" is shown as "Backups"**, to separate backup locations from save states. Internal names (`Saves` view, `saves` namespace) are unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 26  | Selection colour                    | **REVISED 2026-10-13: selection is the accent green** (`--theme-selection` → `--theme-accent`); hovers are light grey. Blue is not used. _Was: blue (`#396cd8`)._                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 27  | Themes                              | **Dark (default), Light and System**, via `data-theme` on `<html>` set from a stored preference. Light mirrors the white Pocket with a darker green for contrast.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 28  | macOS window                        | **Overlay title bar** with the traffic lights inside the sidebar; other platforms keep native decorations. Config and capability change only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 29  | Modals                              | **App modals move to Radix Dialog** (close button, Escape, `onClose`) in (f2); until then the restyled native `<dialog>` stays. OS dialogs from the Tauri dialog plugin stay native.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 30  | Styles                              | **Two styles: "Slanted" (default) and "Modern" (straight edges, more contrast)**, via `data-style` on `<html>`, independent of the dark/light theme. Whether both ship is decided later.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Milestones

Each milestone can land and be tested on its own.

### (a) Theme tokens ✅

`src/theme.css`, `src/main.tsx`, `src/style.css`, and token use in controls,
cores and about CSS.

### (b) Sidebar ✅

`src/components/layout/sidebar.tsx` / `.css`, layout wiring, and English
strings.

### (c) Figma foundations ✅

Variables, text styles, components and three screens. See Current status
for leftovers.

### (d) Icon set + `Icon` component ✅ (Figma swap pending)

- ✅ Set chosen: Pixelarticons.
- ✅ `src/components/ui/Icon/` with a name registry. It imports Pixelarticons'
  own React components, so no SVG loader plugin is needed. Brand marks are
  in `brand.tsx`.
- ✅ Sidebar and all 16 inline SVGs swapped (mapping as on the comparison
  page).
- Swap the Figma Lucide library for Pixelarticons (it has an official Figma
  file).

### (e) UI primitives ✅

`Button` (Radix Slot), `Toggle` (Radix Toggle), `Select` (Radix Select) and
`SearchInput`, styled to the character principles (slanted cuts, control
colours). Re-implement `ControlsButton`, `ControlsCheckbox`, `ControlsSelect`
and `ControlsSearch` on top of them, with no visual change except the Select
dropdown becoming a styled popover.

### (f) Dialog + Popover ✅ (revised)

The modal keeps the native `<dialog>` (restyled); Radix Popover replaces
`ControlsPopoverButton`'s experimental popover/anchor APIs.

### (f2) Modals on Radix Dialog

Replace `components/modal` with a Radix Dialog primitive (`ui/Dialog`):
title, close button, Escape and overlay click call `onClose`. Each of the
17 modal components already receives `onClose` from its parent, so the
switch is per call site. Exceptions: the zip install progress has no
cancel path and the Update modal must not close while installing, so they
hide the close button; the zip replace prompt's close must answer the
backend like its Cancel button.
`PortalContainerContext` stays (Radix portals into the dialog content).

### (g) More Figma screens

Saves, Save States, Palettes and Firmware. They need new components: List
Row, Save State Tile, Palette Swatch Row, Colour Input, Modal, Progress Bar,
Release Notes panel. Blocked by the Figma MCP limit; screenshots with real
data would help.

### (h) Migration and clean-up

Move the remaining raw `<button>` / `<input>` / `<select>` elements to
primitives (Settings is done). `Link` renders a non-focusable `<span>`; make
it a real link or button so keyboard users can reach links (e.g. the sponsor
link). Remove legacy colour aliases once unused. Update the other languages
for the relabelled buttons and new strings.

### (i) Upstream PR

Decide the split (foundations vs. visual), translations for new strings, and
the PR description. Build the description from this plan's principles,
decisions and **Design rationale**, and include the AI disclosure (decision
#13).

**Scope and AI disclosure (draft for the PR description).** Keep it
current as the work changes:

> **Scope:** this PR is mainly a front-end / UI update: React components,
> styles and translations. Back-end changes are kept small and only support
> front-end tasks (e.g. window configuration); core functionality like file
> handling, installs and downloads isn't changed.
>
> This redesign was made with the help of AI (Claude Code). It wrote most of
> the code and the docs, following @olivierbrcknr's direction; every change
> was reviewed and adjusted by @olivierbrcknr. The design reasoning is in
> `docs/redesign-plan.md`.
>
> **Translations:** the new and reworded strings in the non-English
> languages (bg, de, es, fr, ja, pt, tr, vi, zh) were translated with AI,
> matching each language's existing wording. Only strings changed in this
> PR were touched. They haven't been checked by native speakers, so reviews
> and corrections from speakers are very welcome.

### (j) Saves page clean-up ✅

- Proper buttons instead of raw ones: a destructive `Button` theme with a
  bin icon for removing, and a folder icon for choosing a path.
- Cap text-heavy parts at `--content-max-width`.

### (k) Eject SD card — stretch goal (needs backend)

On the start screen, an Eject button that:

1. disconnects the folder from the app without forgetting its path, so
   "reconnect" still works; and
2. if the folder is on an external volume, also ejects the volume so the
   card can be removed safely. A setting (switch) below the button turns
   this second step on or off.

- Step 1 exists: `src/hooks/useDisconnectPocket.ts` (used by Settings →
  Disconnect). Check that it keeps the saved path used for reconnecting.
- Step 2 needs a new Tauri command in `src-tauri`, since nothing ejects
  volumes today: `diskutil eject` on macOS, `udisksctl unmount` +
  `power-off` on Linux, and a shell/WMI eject on Windows. Only offer it when
  the path is on a removable or external volume.

### (j2) Saves titles ✅

Each backup location is titled "Backup {number}" (its position), since the
path made a poor title; the path and backup info sit below. A relative time
("3 days ago") for the latest backup is still open.

### (m) Games by system ✅

The Games screen currently shows one card per core's asset folder, with a
game count. Instead, list the installed games themselves, grouped by system,
following the SD card folders (`Assets/<platform>`). This is possible without
backend changes: `WalkDirSelectorFamily` already lists a platform folder's
files (it drives the current game counts).

### (o) Combobox for filter selects

Searchable selects (type to filter options) for long lists like categories
and authors, built on Radix Popover. Keep the slanted trigger and the
grey-hover / green-check list styling.

### (p) "My Pocket" home screen

The home screen should reflect the user's own Pocket:

- quick colour settings for the 3D Pocket (body and buttons) in a small
  dialog, instead of only in Settings;
- installed firmware, number of installed games and SD card usage (needs a
  disk-space source; check what the frontend can read first);
- total play time, if the Pocket stores it on the SD card (to investigate).

### (n) Resizable sidebar and side panel

Split panes (e.g. `react-split-pane` v3): the sidebar
and the start screen's side panel can be resized, with sizes saved and
min/max limits. Needs to work with the collapsed sidebar.

### (l) Firmware picker ✅

Show the current firmware prominently. Instead of a dropdown as the only way
to pick another version, show a list underneath that loads progressively
("Load previous 10 firmwares"), where each entry previews its release notes
and can be loaded directly. Keep a dropdown or search next to it for jumping
straight to a known version.

## Design rationale (from @olivierbrcknr)

@olivierbrcknr's reasons behind requested changes, kept for the PR description.
Newest at the bottom.

- **Keep the character (2026-10-13):** "The redesign should not destroy the
  character of the app." Keep the edginess and the Analogue Pocket look.
- **Icons (2026-10-13):** the existing icons' edginess is liked; Material
  Symbols are not wanted. Pixelarticons "match the vibe best". 24px icons
  felt too large. Company icons (e.g. GitHub) come from Pixelarticons too;
  Analogue-specific icons come from the GamePocket font's built-in glyphs.
- **Accent (2026-10-13):** the Analogue Pocket's accent is `#63DB84`, and the
  app should use the same colour.
- **Visual reference (2026-10-13):** the Analogue Pocket homepage is the
  layout reference for the app.
- **Sidebar (2026-10-13):** it should share the buttons' slanted look, be
  one list navigable with arrow keys, and act as a tab group, like the
  project gallery built the same way.
- **Keyboard access (2026-10-13):** use tab groups generally, e.g. for the
  core list and game list.
- **Widths (2026-10-13):** Settings was far too wide. Large text elements
  should have a max width; "nothing should be wider than 800px or so". Tiled
  lists can be wider, because their text blocks don't cover the whole
  screen.
- **Start screen (2026-10-13):** library updates belong in a vertical list on
  the right, not a horizontal strip at the bottom.
- **Filter bars (2026-10-13):** they felt bulky; they should look more like
  a regular filter bar.
- **Switches (2026-10-13):** settings that turn on instantly, without a
  separate save, should be switches; "this makes the UX better
  understandable".
- **Saves page (2026-10-13):** should be cleaner, with proper buttons: a
  destructive style with a bin icon, and a folder icon for choosing a path.
  Larger lists keep the content max width too.
- **Firmware (2026-10-13):** show the current firmware; instead of a dropdown,
  a list that loads e.g. the previous 10 firmwares, so each can be previewed
  and loaded. A dropdown or search next to it allows direct selection. "This
  way it's easier to quickly select one firmware and load it instead of
  trying to find the correct one and then seeing its contents."
- **Eject (2026-10-13):** the start screen should have an Eject button that
  disconnects the folder from the app (without removing its path for
  reconnecting) and, for external volumes, ejects the SD card for safe
  removal, with a setting to enable or disable that.
- **Home icon (2026-10-13):** the home entry should use the Analogue Pocket
  icon from the GamePocket font.
- **Focus colour (2026-10-13):** the focus ring should be in the theme
  colour, via a separate "focus" token.
- **Settings width (2026-10-13):** "can even be smaller, maybe 720 or even
  640".
- **Scope (2026-10-13):** Eject is a stretch goal; "this PR mainly attempts
  to solve frontend elements and tries not to touch backend".
- **Header bars (2026-10-13):** filters were still stretched and actions not
  always clear; headers follow "search + filter --- actions / buttons".
- **Saves titles (2026-10-13):** entries titled like "Backup 26-10-13" with
  "… days/minutes/hours ago", content below; to be styled together in
  detail.
- **Games (2026-10-13):** list the installed games, not the cores again,
  preferably by system, following the folders on the SD card.
- **Empty states (2026-10-13):** the screenshots empty state was too large;
  use regular centred text.
- **Palettes and icon buttons (2026-10-13):** palettes didn't feel like
  cards and their buttons weren't part of them. Use icon buttons (the same
  button component) with a tooltip carrying the label. "We should never have
  a button without a label (accessibility) but either in the button or
  within a tooltip."
- **Start screen side panel (2026-10-13):** a tab toggle on top switches
  between the openFPGA library updates and the "What's new" list; the
  changelog "does not make sense in the modal separately". The sponsor
  button is centred above the title to be more prominent.
- **Unified controls (2026-10-13):** Settings' buttons and inputs differed
  from the rest; unify them.
- **Button labels (2026-10-13):** every button uses a verb and a noun
  (action and subject), like "Add Core"; some buttons didn't make clear what
  happens.
- **Focus rings (2026-10-13):** a focus outline should only be visible when
  keyboard focus is used, not after a click (solved with a `useKeyboardFocus`
  hook).
- **Home layout (2026-10-13):** the title clipped before hovering; the home
  screen needs to be laid out as a whole.
- **Eject (2026-10-13):** the in-app eject (not the volume eject) was
  missing. It belongs centred beneath the Analogue Pocket as a ghost
  (tertiary, outline) button.
- **Skeletons (2026-10-13):** skeleton loaders for core cards and other
  large lists.
- **Saves titles (2026-10-13):** "potentially add a name to the backup, e.g.
  Backup 1 (maybe not a name but an id?) … and then have the info below. The
  path seems just like a bad title."
- **Motion (2026-10-13):** buttons and hover actions scaled too drastically.
  Scale only on press (`:active`) and only slightly (0.99–0.95); on hover,
  show a lighter background instead (e.g. the updates list).
- **Split panes (2026-10-13):** maybe add sizing for the sidebar and the
  update panel with split panes, as in other desktop apps.
- **Sidebar animation (2026-10-13):** the folding animation's timing was off.
- **Button hierarchy (2026-10-13):** primary → green, secondary → white
  (mostly current), tertiary → outline, danger/destructive → red.
- **Backups (2026-10-13):** rename "Saves" to "Backups" to make it clearer.
  Paths should be truncated, with two icon buttons: copy the path, open the
  path.
- **One home screen (2026-10-13):** the home screen should be the same with
  or without an SD card connected, showing the sidebar as well; ideally the
  same component / view.
- **Settings menu (2026-10-13):** settings need a submenu on the left to jump
  to sections, similar to VS Code.
- **What's new cache (2026-10-13):** once loaded, "What's new" should stay
  cached instead of loading every time.
- **Side panel (2026-10-13):** the background should come from the pane, not
  the lists inside it. Tabs weren't visible enough; they should look like a
  white button inside a proper frame.
- **Tooltips and slant (2026-10-13):** tooltips should appear sooner and have
  slanted edges; how slanted edges are should be defined in one place to
  keep them in sync.
- **Updates toggle (2026-10-13):** a show/hide toggle for the news on the home
  view, like the sidebar's, remembered when the app is reopened.
- **Icon buttons (2026-10-13):** tertiary icon buttons have no outline, but
  still show the background on hover.
- **Disconnected home (2026-10-13):** without an SD card, the home screen
  should not show the sidebar.
- **Updates panel motion (2026-10-13):** showing/hiding the updates should
  move in like the sidebar does.
- **3D Pocket (2026-10-13):** it jumped during the sidebar transition and
  should be smooth; the canvas doesn't need to be full size.
- **Copy feedback (2026-10-13):** the copy button needs a tooltip and should
  confirm "copied" for a second; buttons were too small and shouldn't change
  size; the path should sit in a frame like code inputs.
- **Window frame (2026-10-13):** the window bar should have the same colour
  as the sidebar, if possible.
- **Title clipping (2026-10-13):** without mouse interaction, the Pocket
  Sync logo was clipped at the top.
- **Tab frame (2026-10-13):** the tab frame should have slanted sides too.
- **Firmware rows (2026-10-13):** the foldable titles had the page's
  background and dark gaps; use light separators. Later: since there are
  only a few versions, always show them all, cache them once loaded so the
  GitHub limit isn't reached, only unfold the installed one, don't scale
  titles on press, and make each version a separate container.
- **Backups (2026-10-13):** title as "Location 1" plus the folder name; the
  path field slanted; a "Back Up Now" action and last-backup times as "…
  ago", because a backup that just happened wasn't visible.
- **Settings (2026-10-13):** a separator between menu and content; label and
  select framed as one unit; URLs treated like the backup paths (a shared
  component); sections with sticky titles that also show in the menu,
  built to be reused.
- **Update buttons (2026-10-13):** update only the installed cores, not
  everything; split into a secondary and a tertiary button.
- **Commit and privacy (2026-10-13):** make an in-between commit without
  pushing or AI attribution, after checking that no private data, private
  links or computer-specific paths are in the repo.
- **Overscroll (2026-10-13):** the app window shouldn't overscroll.
- **Credits (2026-10-13):** the main contributor wants the "Thanks to"
  section prominent, at the very top of the settings, and it should credit
  the UI sources used (icons, font, etc.) — supporting other contributors
  matters in an open-source project.
- **Settings menu (2026-10-13):** it flashed on click and wasn't fully
  scrollable.
- **Header bars (2026-10-13):** a unified component on the page background
  instead of black, which also looks more modern.
- **News panel (2026-10-13):** library updates and "What's new" should share
  one style (body font, title and date layout); library updates are
  clickable and need a hover state.
- **3D Pocket (2026-10-13):** it reloaded when an SD card connected; make it
  smarter. The version number can be small in the bottom-right.
- **Device overview (2026-10-13):** a small overview in the sidebar, below
  "Pocket Sync", e.g. the firmware version.
- **Translations (2026-10-13):** check that updated wordings (e.g.
  "Backups") match in the other languages; always update the translations
  when we change something, but only the ones this branch touched.
- **Collapsed sidebar (2026-10-13):** narrower than the macOS traffic
  lights, which looked weird.
- **Update filters (2026-10-13):** the Update filters have many options with
  multiple selections and need the combobox; one empty row was unclear; add
  select all / clear all.
- **Page checklist (2026-10-13):** a checklist of every page that needs
  styling, to go through them one by one and adjust stylings. Mainly a
  documented list so nothing is forgotten (sub-modals, sub-pages etc.),
  since not every screen is known yet.
- **Modern style (2026-10-13):** besides the slanted layout, a more modern
  one closer to the Analogue Pocket marketing site, with more contrast,
  switchable like a theme (also as a setting), so both can be kept and
  decided on later. Not the font: the button edges etc.
- **Device overview removed (2026-10-13):** the firmware info in the
  sidebar went again.
- **Pocket colours (2026-10-13):** the colours button belongs next to
  Eject; it must be clear that it's a setting of the Pocket, not the app.
- **Modals (2026-10-13):** the non-native modals should be Radix
  eventually, so they can get a close button etc.
- **Backups width (2026-10-13):** backups use the full width, not the
  reduced content width.
- **Reusable path field (2026-10-13):** paths and URLs, like the reconnect
  location, use one reusable component; the inline path glitched the
  settings when the sidebar toggled.
- **Update overview (2026-10-13):** it read like a warning; make it an info
  section like the firmware one.
- **macOS window (2026-10-13):** no unneeded top bar; the traffic lights
  inside the sidebar, with padding, and a solution when the sidebar is
  folded.
- **No blue (2026-10-13):** selection should be green and hovers light grey,
  including in dropdowns.
- **Modal buttons (2026-10-13):** buttons in modals weren't updated yet.
- **My Pocket (2026-10-13):** the home screen should reflect "my" Pocket:
  easy colour settings, installed firmware, SD card usage, number of games,
  and total play time if the SD card stores it.
- **Combobox (2026-10-13):** consider a combobox for selects like the
  filters.
- **Themes (2026-10-13):** a light theme and a theme selector (system, dark
  as default, light), mirroring the Pocket's two main colours.
- **Special characters (2026-10-13):** "é" wasn't shown in save states;
  special characters shouldn't be an issue anywhere.
- **Keyboard (2026-10-13):** the main view itself was focusable without
  being usable, and the sidebar toggle wasn't part of the menu's arrow-key
  list.
- **Translations (2026-10-13):** translations must keep working; always check
  what changed.
- **Token sweep (2026-10-13):** check the screens that don't use the colour
  tokens yet and adjust them to fit.
- **GitHub handle (2026-10-13):** refer to @olivierbrcknr by handle;
  reference other repositories only if they're public.
- **JSDoc (2026-10-13):** comments on props are JSDoc, not inline comments.
- **AI disclosure (2026-10-13):** for a PR or anything public, actively
  mention that AI was used to help with this redesign. This includes a
  disclaimer that the translations were done with AI. The Figma work isn't
  mentioned in the PR, as it's irrelevant to the app's code. The PR also
  states that it's mostly a front-end / UI update, with only small backend
  changes that support front-end tasks (kept general, as more may follow).
- **Text levels (2026-10-13):** text colours come in headline, body and soft
  variants, usually via opacity "to make dim
  colors a bit easier to select, e.g. for dates in the save states".
- **Tooling (2026-10-13):** single-use tools (like the Figma token export)
  don't belong in the repo.
- **Process (2026-10-13):** explanations @olivierbrcknr gives should always be
  documented, so the reasoning can go into the PR later.

## Open questions

- Should a light theme be part of the first PR, or come after the
  foundations land?
- Translations were written by AI (see the disclosure): should the PR ask
  native speakers to review them?
- Should `CLAUDE.md` be added to the repo with a pointer to this plan? It
  helps future sessions, but would ship upstream unless excluded.
