# UI redesign — plan

Started 2026-10-13 on the fork branch `ob/redesign`. Status: **in progress.
Foundations, icons, UI primitives, layout passes, the firmware picker, the
by-system games list and the core detail page (q) with its review passes are
committed (`b14e23f`, `b7963a3`, `2970e32`). Review rounds continue, screen
by screen. This PR is frontend-only; backend work (e.g. Eject) is a stretch
goal.** See **Current status** below.

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
  rationale** below (dated, in @olivierbrcknr's words as closely as possible). That
  section is the source for the reasoning in the PR description, so never
  skip it, even for small requests;
- **whenever an English string is added or reworded, update the other
  languages in the same change.** Touch only the keys this branch changed,
  match each locale's existing terms (e.g. Japanese and Vietnamese keep some
  view names in English), and skip a namespace a locale doesn't translate
  at all (it falls back to English as a whole). Check ICU plurals still
  parse. German always addresses the user informally ("du", never "Sie";
  decided 2026-10-16).

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

- ✅ **(q) Core detail page (2026-10-14).** Committed with its review passes
  (up to the fifteenth) in `2970e32`. See the milestone below.
- ✅ **Sixteenth pass (2026-10-15).** See the (q) milestone. Also closes the
  fifteenth pass, which was cut off before its last lint check: a missing
  blank line in `Button.css` (and the old `theme.css` comment warning) are
  fixed.
- ✅ **Seventeenth pass (2026-10-15).** See the (q) milestone: one `Tile`
  for every grid of items, Save States and Palettes in a `Grid`, settings
  type, header bars, rounded focus rings in modern.
- ✅ **Eighteenth pass (2026-10-15).** See the (q) milestone: tabs keep the
  scroll position, horizontal save state tiles at 10:9, settings at 16px
  without stray line breaks, and a check of the Games grouping.
- ✅ **Nineteenth pass (2026-10-15).** Home fits the window without
  scrolling, "Disconnect Pocket" instead of Eject, colour swatches in the
  Pocket colour selects.
- ✅ **Twentieth pass (2026-10-15).** Plugins and Fetch on `Tile`, our
  buttons and the new `Field`; search and an author filter on Plugins; the
  Add Fetch Source modal explains every field.
- ✅ **Twenty-first pass (2026-10-15).** Tooltip padding, Pocket Colours
  as an icon button, full-width plugin tiles, a themed plugin window.
- ✅ **Twenty-second pass (2026-10-15).** "Nothing matches" for emptied
  lists, Fetch status that refreshes (and a last-fetch time), a new
  `ProgressBar`, a loading preview, What's New and Library Updates fixes.
- ✅ **Twenty-third pass (2026-10-15).** Long fetch names, Palettes
  flicker, 160ms spinner, Select press, the Updatable filter, search field
  focus, What's New dates and bullets, Library Updates' time.
- ✅ **Twenty-fourth pass (2026-10-16).** A newly connected card no longer
  shows the previous folder's files, the connected path on Home, how to
  save and load a memory, full core names on Save States, a "Jump to" menu
  on Firmware, Add via Code with a real form, modals without a border.
- ✅ **Twenty-fifth pass (2026-10-16).** The path on Home is gone again;
  letterboxed screenshots on the 3D Pocket; screenshot dates; save state
  images without the empty strip; a cleaner screenshot detail; the Backups
  timeline rebuilt; the sidebar regrouped.
- ✅ **Twenty-sixth pass (2026-10-16).** Screenshots in sections (game,
  core or date) with Game and Core filters; Save States by core or game
  with a Game filter; links from games to Games; the original Backups
  view back, made visible; Palettes without the skeleton flashes; the
  palette detail page (r).
- ✅ **Twenty-seventh pass (2026-10-16).** Photo export and update progress
  modals restyled, with previews in Settings → Developer; games without a
  core; Cores filtering (counts, speed, License and AI-ness filters);
  palette fixes; zip install modal; modals at most 800px; links, tags,
  search clear, Home on narrow windows.
- ✅ **Twenty-eighth pass (2026-10-16).** Filter groups with Clear Filters
  and marked selects on every header bar; info boxes instead of tips;
  Games ↔ Platforms links; backup rows with game names; zip install
  toggles; update demo fixes; photo demo exports.
- ✅ **Twenty-ninth pass (2026-10-16).** "Modern" is shown as "Straight"
  (REVISED decision 30); slanted focus rings on the edge, slant-aware gaps
  and a slanted filter divider; Home hides the Pocket only when short and
  narrow; the update scene's Pocket lit; the platform's games list full
  width.
- ✅ **Thirtieth pass (2026-10-16).** Light theme fixes (frames, selected
  borders, search field), no button shadows, labelled layer buttons,
  MiSTer Sync rebuilt (connect modal and two-pane session, with a preview
  in Settings → Developer), the style named "Straight", German in "du".
- ✅ **Thirty-first pass (2026-10-16).** Cores' "Nothing matches" sits
  right below its section heading (the emptied grid is hidden; it pushed
  the message down). `<html>` starts with `data-theme="dark"
data-style="slanted"`, the defaults, so the first paint matches before
  the stored setting loads (the code defaults were already dark and
  slanted; a stored choice still wins). Short windows: the Pocket was pinned to the
  left edge with the text centred in the rest, far apart on wide windows;
  the Pocket and the info are now one grid (Pocket column, info column)
  centred together.

### In progress

- The sixteenth to thirtieth passes wait for @olivierbrcknr's review in
  the running app (checked with `tsc`, ESLint, stylelint and Prettier
  only).

### Next

**Before the PR** (as of 2026-10-16):

1. Review in the running app: the sixteenth to thirty-first passes are
   only checked with `tsc`, stylelint, Prettier and a `vite build`. Tick
   the **Page checklist** in both styles and both themes.
2. Decide what's still waiting (see **Waiting on**): Plugins' one-line
   explanation, Games' Clean Up Files / Build Instance JSON, modal radius,
   whether both styles ship (decision 30), light theme in this PR (open
   question).
3. Finish or consciously leave the "tokens only" screens: Load Required
   Files, Manage Data Packs / Image Packs, the image editor, Move MROM
   Dumps, Clean Up Files, Build Instance JSON, Palette Town, Save Mapping,
   the zip file tree, the plugin window, the error screen, screenshot
   tiles. Either restyle them or list them as follow-ups in the PR.
4. (h) clean-up: 19 raw `<button>`s and 12 `<input>`s in 20 files outside
   `ui/` (some on purpose: list rows, swatches, timeline bars), unused
   strings (the Update page's, `cores.controls.filters_group`), legacy
   colour aliases, `ts-prune` for dead code, the `debug` `console.log`s.
5. Linting: ESLint has no config in the repo, so it wasn't run; agree with
   upstream on how to lint (or add a config).
6. Commit the passes since `2970e32` (only when @olivierbrcknr asks), on a
   clean history for upstream (decide the split, milestone (i)).
7. Write the PR description from the principles, decisions and Design
   rationale, with the scope and AI disclosure in (i); attach before /
   after screenshots; maybe update the README's screenshots (they're out
   of date, e.g. the old Update All picker).
8. Leave out of this PR: (s) game names and images, (n) split panes, (k)
   Eject, (g) Figma screens.

- (n) Resizable sidebar and side panel (split panes).
- Modals: Manage Data Packs and Manage Image Packs need a pass (layout,
  primitives, explanations), requested 2026-10-15.
- (s) Game names and images: a separate PR (decided 2026-10-15), see the
  milestone.
- (h) Migration and clean-up.
- Stretch: (k) Eject.

### Waiting on

- Committing: only when @olivierbrcknr asks. Committed so far: `b14e23f`,
  `b7963a3`, `2970e32`; the sixteenth to thirtieth passes are uncommitted. Never push, and
  no AI attribution in commit messages.
- Plugins: whether the page should explain what a plugin is in one line
  (the info note only links to the specification).
- Games: whether Clean Up Files and Build Instance JSON stay in the Games
  header, move elsewhere, or go (see the sixteenth pass for what they do).
- Figma MCP call limit (Starter plan) for the remaining Figma work (g).
- Modals (2026-10-16): they already use `--radius-modal` (= `--radius`,
  2px, like buttons in Modern); slanted buttons have no radius. Whether
  modals should get a larger radius (e.g. `--radius-popover`).

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
- [ ] Drop overlay while dragging a .zip over the window: restyled
- [ ] Search shortcut (⌘F / Ctrl+F) and its key caps: restyled

### Home (Pocket Sync)

- [ ] Without SD card: 3D Pocket spinning, Connect, "not a Pocket" tip:
      restyled
- [ ] Connected: 3D Pocket with screenshots, stats row, Colours popover,
      Eject, version: restyled
- [ ] Firmware / app update banners: partly
- [ ] Side panel: Library Updates tab, What's New (changelog) tab,
      show / hide: restyled

### Games

- [ ] Games by system (full width, Show in Folder per game), search,
      category filter: restyled
- [ ] Empty state (no games): restyled
- [ ] Modal: Move MROM Dumps: tokens only
- [ ] Modal: Clean Up Files: tokens only
- [ ] Modal: Build Instance JSON: tokens only

### Cores

- [ ] Cores list (cards with tags incl. Manual, search, category,
      platform and features filters, zip tip on top, hidden cores):
      restyled
- [ ] Core detail, not installed (hero, Install step, license / firmware
      notices, Overview and Releases tabs): restyled
- [ ] Core detail, installed (hero, Update / Load Required Files /
      Uninstall step, replaced and firmware notices): restyled
- [ ] Core detail tabs: Overview (description, features, platforms,
      Info.txt, AI report, facts), Inputs (button list + 3D Pocket),
      Settings (core settings, display modes, JT Analogizer), Releases
      (install another version, release notes): restyled
- [ ] Modal: Load Required Files (incl. its loading state): tokens only
- [ ] Modal: zip install (file groups and options as switches, Cancel /
      Install), progress and replace prompt: partly (file tree and progress
      still old)

### Update (page removed 2026-10-14)

The page is gone; updating happens on Cores (Updates section, Update All).

- [ ] Modal: update progress (phases as steps, 3D scene, progress bars,
      skip, finished report; opened from Cores; preview in Settings →
      Developer): restyled
- [ ] Skip warnings and missing-archive confirmation: native

### Platforms

- [ ] Platforms list (cards with tags, search), Manage Data Packs / Image
      Packs, Remove Coreless Platforms: restyled (the buttons are still the
      Controls ones)
- [ ] Platform detail (banner opens the image editor, editable fields,
      cores as cards): restyled
- [ ] Modal: Manage Data Packs: tokens only
- [ ] Modal: Manage Image Packs: tokens only
- [ ] Modal: Image editor (stamps, import): tokens only
- [ ] Delete confirmation: native

### Firmware

- [ ] Installed firmware, version list, release notes accordion:
      restyled
- [ ] Download message: native

### Screenshots

- [ ] Screenshots in sections (game / core / date), search, Game and Core
      filters, select mode, multi-export: partly (tiles are still the old
      hover drawer)
- [ ] Empty state: tokens only
- [ ] Screenshot detail (save, share, upscaled toggle, info): restyled

### Backups (Saves)

- [ ] Backup locations list, Back Up Now, Add Backup Location, path field:
      restyled
- [ ] Empty state: restyled
- [ ] Backup detail (timeline: dates, guides, version bars, restore):
      restyled
- [ ] MiSTer Sync: connect modal, session (saves, comparison, copy),
      activity; preview in Settings → Developer: restyled
- [ ] Modal: Save Mapping: tokens only
- [ ] Delete / restore confirmations: native

### Save States

- [ ] Save states (tiles in a grid per core or game, sticky headers,
      Group by, Game filter, search,
      core / platform filters, selection, delete): restyled
- [ ] Empty state (how to save and load a memory): restyled
- [ ] Modal: Game Boy Camera photo export (presets, custom shades, photo
      list, export; preview in Settings → Developer): restyled
- [ ] Delete confirmation: native

### Palettes

- [ ] Palettes list (tiles in a grid, share code, rename, duplicate,
      delete): restyled
- [ ] Palette detail (name edited in place, header actions, game preview,
      colour swatches, save, reset): restyled
- [ ] Modal: Add Palette via Code (share code field, hint, error): restyled
- [ ] Modal: Browse Palette Town: tokens only

### Fetch

- [ ] Fetch list (sources as tiles, status tag, Fetch Files, remove):
      restyled
- [ ] Modal: Add Fetch Source (source, folder pickers, archive name check,
      extensions, explanations): restyled
- [ ] Remove confirmation: native

### Plugins

- [ ] Plugins list (tiles, search, author filter, Run, Remove): restyled
- [ ] Modal: Add plugin (GitHub URL with hint and check): restyled
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
   green `#84E38F`** (`--analogue-green`, the green Analogue uses for its
   buttons; was `#63DB84` until 2026-10-14), used for active and update states, always with dark
   text on top (darker green only for text and icons on the light theme's
   page). Green also marks selection (decision #26), red is for danger.
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
   (720px). Tiled grids may use the full width, since their text blocks
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
| 7   | Sidebar                             | **Icon + label rows with the controls' slanted cut, grouped** (Home / library / media and data / tools), with Settings pinned at the bottom. Collapsible to icons only, with Radix tooltips; the collapsed state is saved via jotai `atomWithStorage`. `--sidebar-width` is a token, not measured. Its strings are translated like all others (see Translations in Current status).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 8   | Typography                          | **Inter for UI, GamePocket for display**, exposed as `--font-body` / `--font-display`. Figma text styles bind their family to matching variables. The Figma MCP can't use local fonts, so Figma uses Silkscreen as a stand-in until switched by hand.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 9   | Accent colour                       | **REVISED 2026-10-15: Analogue green `#84E38F` as the accent fill in both themes** (`--analogue-green` → `--theme-accent`; revised 2026-10-14 from `#63DB84`, which replaced `#589050`). Anything placed on it uses `--theme-accent-text` (#111): off-white text on the green is about 1.6:1 contrast, dark text about 11:1. Green text, icons and borders on the page use `--theme-accent-foreground`: the same green in dark, `#1e8e4e` in light, where the Analogue green on white is too faint. _Was: the light theme used `#1e8e4e` with white text as its accent fill._                                                                                                                                                                                                                                                                                                       |
| 10  | Keyboard navigation                 | **Lists and grids are tab groups with a roving tabindex.** Sidebar: Radix Tabs (vertical, manual activation, so arrowing doesn't load every screen). Grids and other lists: `useRovingFocus` + `getSpatialNeighbor`, ported from an earlier implementation, because arrow keys must follow the visual layout of a wrapping grid and items may be lazily rendered or filtered out. `react-roving-tabindex` was considered; the in-house hook handles spatial grids and DOM-filtered items without extra wiring.                                                                                                                                                                                                                                                                                                                                                                      |
| 11  | Content width                       | **REVISED 2026-10-13: `--content-max-width: 720px`** for text-heavy views (Settings first, then Saves, Firmware, core info…). Tiled grids are exempt. _Was: 800px._                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 12  | Checkbox vs switch                  | **Settings that apply immediately use `Switch`**; checkboxes or `Toggle`s are for choices that need a separate save or submit, or for filters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 13  | AI disclosure                       | **The upstream PR (and any other public write-up) states that AI (Claude Code) was used to help with the redesign**: what it did (code, docs, translations) and that every change was directed and reviewed by @olivierbrcknr. Translations get their own note, because @olivierbrcknr can't check every language.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 14  | Text colours                        | **Three levels from one colour with alpha:** headline (100%), body (84%, default), soft (53%, dates and secondary info). Use these instead of ad-hoc `opacity` on text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 15  | Scope                               | **REVISED 2026-10-13: this PR is frontend-only.** It does not touch backend code in `src-tauri`; the only exception is window styling in `tauri.conf.json`. Features that need new backend commands (e.g. ejecting the SD card volume) are stretch goals for a follow-up.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 16  | Focus colour                        | **`--theme-focus`** (the accent green; the darker foreground green in light) for every keyboard focus ring, separate from `--theme-selection`, which marks selected items (also green since decision #26).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
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
| 27  | Themes                              | **REVISED 2026-10-15: Dark (default), Light and System**, via `data-theme` on `<html>` set from a stored preference. Light mirrors the white Pocket and uses the same Analogue green fills as dark, with a darker green only for text and icons. _Was: light used a darker green for everything._                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 28  | macOS window                        | **Overlay title bar** with the traffic lights inside the sidebar; other platforms keep native decorations. Config and capability change only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 29  | Modals                              | **App modals are Radix Dialog** (close button, Escape, `onClose`; done in (f2)). OS dialogs from the Tauri dialog plugin stay native.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 30  | Styles                              | **REVISED (2026-10-16):** the second style is shown as **"Straight"** (first "Rounded", but its 2px radius isn't round; "Clean" judged the other again) (internal value `modern`, `data-style="modern"`), so the two read as equals ("Slanted" / "Straight") instead of "Modern" diminishing "Slanted". _Was: Two styles: "Slanted" (default) and "Modern" (straight edges, more contrast), via `data-style` on `<html>`, independent of the dark/light theme. Whether both ship is decided later._                                                                                                                                                                                                                                                                                                                                                                                 |

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

### (f2) Modals on Radix Dialog ✅ (2026-10-14)

Done: `components/modal` is now Radix Dialog (`@radix-ui/react-dialog`
1.3.1, the same release train as Popover). Every modal has a `title` (in the
header) and, when it can be dismissed, an `onClose` that adds the close
icon button (top right) and Escape. Outside clicks never close it.
Standalone "Close" buttons were removed (the X replaces them); "Cancel" next
to a confirming action stays. The zip install modal's X answers the backend
like its Cancel. Their old `close` strings are unused now and can go in (h).

Original plan:

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
primitives (Settings is done). Remove legacy colour aliases once unused, and
the strings left unused by removed screens and buttons (the `update` page
strings, modal `close_button` keys). Already done along the way: `Link` is a
real `<a>` (sixth pass), and the other languages are translated.

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

### (o) Combobox for filter selects ✅

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

### (r) Palette detail screen ✅ (2026-10-16)

Done in the twenty-sixth pass, on `DetailPage`: see the (q) milestone's
pass notes.

### (s) Game names and images (proposal, separate PR)

Decided 2026-10-15: not part of the redesign PR; tackled separately,
maybe as its own PR.

The Games list shows file names. Getting proper names and box art,
frontend only:

1. **CRC32 per game file:** `invokeFileMetadata` already returns it (the
   backend reads the whole file, so it's fine for cartridge-sized ROMs but
   slow for CD images; compute lazily per visible row and cache).
2. **Images from the SD card first:** the Pocket's own library images,
   `System/Library/Images/<platform>/<crc32>.bin`, which
   `libraryImageSelector` already decodes (used by the MROM modal). They
   exist only for the cartridge platforms (GB, GBC, GBA, GG, …) and only if
   the user installed an image set.
3. **Names from a public database:** libretro-database's per-system DAT
   files (`metadat/no-intro/<System>.dat`, CC-BY-SA-4.0) map CRC32 to the
   No-Intro name; fetch per system on demand and cache. Many files are
   already named that way, so the file name stays the fallback.
4. **Box art online (optional):** thumbnails.libretro.com serves
   `<System>/Named_Boxarts/<No-Intro name>.png`. Needs a platform-id →
   libretro system name table, a setting to turn online images off, and a
   note about the images' copyright (they're scans of commercial boxes).

Open: whether online lookups are wanted at all (privacy and offline use),
and which platforms to start with.

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

### (q) Core detail page ✅ (2026-10-14, awaiting review)

- **`ui/Tag`** (slanted chip; themes neutral, accent, warning, danger,
  highlight, muted) and **`ui/Accordion`** (extracted from the Firmware list,
  which now uses both). `cores/tags.tsx` (`CoreTags`) shows a core's status:
  Installed, Update {version}, Replaced, Analogizer, AI score, License.
- **Cards:** name, author, a smaller soft version line, and tags at the
  bottom instead of the corner overlays (AI letters, Analogizer icon, sponsor
  ribbon). Not-installed cards got `role="button"`, so arrow keys reach them.
- **Features** (`cores/features.ts`): save states / sleep, dock, analog dock,
  cartridges, link cable, Analogizer, read from `core.json` (installed) or the
  inventory. Shown as tags on the Overview, and a **Features** filter
  (MultiSelect) on the Cores list. RTC isn't in `core.json`, so it can't be a
  feature yet.
- **Detail layout:** hero (image; title, author, version, tags; next steps)
  side by side from 720px container width, stacked below. Notices (replaced,
  firmware too low, license) under it. Then tabs: **Overview** (description,
  features, platforms, Info.txt, AI report; facts column from 860px),
  **Inputs**, **Settings**, **Releases**. Regular page background, framed
  panels, no black fills.
- **Guidance:** one panel says what to do and why. Not installed: what Install
  does and that required files come after, with a primary Install button.
  Installed: Update to {version} (primary when available), Load Required
  Files with a found / missing count (primary when files are missing), and
  Uninstall. The header keeps only Back (and Hide Core).
- **Inputs and Settings left their modals** and are tabs. Inputs lists every
  button (key cap + action) next to the 3D Pocket. Settings uses Select and
  Switch, and holds Display Modes (now keyboard-reachable toggles) and the JT
  Analogizer options (selects).
- **Releases:** "install another version" on top, then the GitHub release
  notes in the Firmware accordion style, with Latest / Installed /
  Pre-release tags; 10 at a time.
- **Modal bug:** Escape closed the native `<dialog>` without telling React,
  so the modal stayed "open" invisibly and couldn't be reopened. `Modal` now
  stops the native close and calls an optional `onClose`; without it, Escape
  does nothing. Dismissible modals pass `onClose` (busy ones only when idle).
- Removed: `cores/version`, `info/requiredFiles`, `info/supportsBubble`, the
  `core_info` keys `required_files_count` and `controls.update`.

Second pass (2026-10-14, after review):

- The platform image is a **full-width banner** right under the header again;
  name / status and the next-steps panel sit side by side below it.
- **Header title:** the core's name and main platform fade into the header
  bar once the page title scrolls under it (`ControlsTitle`,
  `useScrolledPast`).
- **Shared side padding:** `--page-padding-inline` (16px) is used by header
  bars, the core page and Firmware, so content lines up with the header.
  Header bars were 12px before.
- **Analogizer tags** use the Analogizer blue (`--theme-analogizer`, a brand
  colour; the "no blue" rule is about selection and hover).
- **Feature tags** only show supported features; the section is hidden if
  there are none. The `muted` tag theme went with it.
- **Missing images:** `PlatformImage` shows a placeholder in
  `--theme-surface` with the core's name when the SD card has no image;
  `InventoryPlatformImage` does the same when the online image fails to load
  (cards, banner, Update list).
- **Platforms:** a line under the title ("Nintendo Game Boy, 1989"), and
  platform cards on both pages, from the SD card's platform files or else
  the inventory. Cores with several platforms show each platform's image.
- **Releases:** each release has an "Install This Version" button (tertiary),
  matched to the inventory download by version; the installed one has none.
  The version picker only remains as a fallback for non-GitHub cores or when
  no version matches.
- **Hide Core** moved from the header into the next-steps panel (tertiary,
  at the end, tooltip explains Settings). It keeps not-installed cores out
  of the Available list and the Update page.

Third pass (2026-10-14, after review):

- **`DetailPage`** (`components/shared/detailPage`) for one item (a core, a
  platform): the back button (and actions) above a full-width banner; the
  sticky header bar only slides in, with the title, once the banner has
  scrolled away. It also holds the shared content styles
  (`detail-page__content`, `__hero`, `__heading`, `__title`, `__section`,
  `__facts`, `__hint`) and `DetailSection` / `DetailFacts`.
- **Platforms:** cards like the core cards (placeholder image, name, maker,
  year, category and Archived tags instead of the corner icon). The detail
  page uses `DetailPage`: the banner image is a button that opens the image
  editor, fields are label / value / Edit rows (`TextInput`, Save / Cancel),
  and its cores are core cards that open the core.
- **Cross-links:** platform names on the core page (line under the title,
  platform cards) open the platform's page, when its file is on the SD card.
- **Tag icons** scale with the tag's text (`Icon size="text"`), so the
  Analogizer glyph is no longer too big.
- **Releases:** the install button sits in the accordion's header row
  (`AccordionItem` `action`).
- **Inputs:** OrbitControls' zoom is off; it caught the mouse wheel (the
  distance is fixed anyway), so the page couldn't scroll over the Pocket.
- **Core settings** are written to the SD card on every change (no save
  button needed); a hint says so.
- **Search shortcut:** ⌘F / Ctrl+F focuses the page's search (`SearchInput`
  `shortcut`, on by default in `ControlsSearch`), shown as key caps (`Kbd`)
  that light up while held; hidden while typing.
- **Cores list:** a **Platform** filter (searchable, grouped by
  manufacturer, only platforms some core uses); the drag-a-zip tip moved to
  the top; installed cores missing from the inventory get a **Manual** tag.
- **Drop overlay:** dragging a .zip over the window shows "Drop to Install"
  (`zipInstall/dropOverlay.tsx`, Tauri webview drag events; the drop itself
  is still handled by the backend).

Sixteenth pass (2026-10-15, after review):

- **Games tools, explained (no change):** _Clean Up Files_ lists the
  macOS metadata files under `Assets` (`._*` resource forks and `.DS_Store`,
  which Finder writes to the SD card) and deletes them; the Pocket can show
  `._` files as broken games. _Build Instance JSON_ runs the instance
  packager for cores that ship an `instance-packager.json` in their
  `Cores` folder (mostly CD-based cores): it scans their game folders and
  writes the `instance.json` files the Pocket needs to launch multi-file
  games, and logs each file written or skipped. Both work and have no other entry point, so
  they stay; where they live is open (see Waiting on).
- **Home:** the update banners pushed Colours / Eject below the window
  (fixed 55vh Pocket, `overflow: hidden`). The Pocket is now at most what's
  left of the window height (`100vh - 340px`), minus 46px per update banner
  (`:has(.about__update-link)`), and the column scrolls as a last resort.
- **Concentric radii:** a frame around rounded items gets their radius plus
  its padding: the tab frame (`--radius` + 3px, modern), and dropdown lists
  and popovers (new `--radius-popover`, `--radius` + 4px, with rounded rows).
- **Modern frames:** the 1px frames drawn with clip-path (tertiary buttons,
  the tab frame, code fields) kept square corners under the rounded
  background; in modern they're inset box shadows that follow the radius.
  Tertiary buttons have no outline in modern, only the hover background.
- **Multi-select dropdowns:** the panel and its rows use the radius; the
  Select All / Clear All buttons follow the frame fix above.
- **Cores list:** Updates, Installed and Available share one section header
  (`cores__section-header`: same margins, padding and height, with or
  without an action). The Updates heading had no bottom margin and the
  others the browser's default margins.
- **Core detail links:** the author links to their GitHub profile (hero and
  facts), a new **Source Code** fact links the repository when it differs
  from the URL, URLs show without `https://`, and Firmware Required opens
  the Firmware page. `Link` takes `onClick` for in-app links.
- **Settings:** notes (`Callout`) inside a setting have the same 15px gap to
  the next element as text. The section menu's scroll area now reaches the
  window's top and bottom, with the 16px padding inside it, so items no
  longer get cut off 16px from the edge.
- **Light themes:** the green fills (primary buttons, tags, switches,
  badges) use the Analogue green with dark text, like dark. Green text,
  icons and borders on the page use the new `--theme-accent-foreground`
  (`#1e8e4e` in light). Focus rings stay the Analogue green (the darker
  one looked off; seventeenth pass). Destructive buttons have
  white text in both themes (`--theme-danger-text`). Light modern's sidebar
  is `#f0f0f0` against the white content, like dark's darker sidebar. Core
  and platform cards get a 1px separator frame in light, drawn above the
  image, so white platform images don't blend into the page.

Thirtieth pass (2026-10-16, after review):

- **Light theme:** screenshot tiles get the light frame like `Tile`s;
  selected tiles were grey because the light frame rule out-specified the
  selection (now `:root .tile.tile--is-selected::after`), same for
  screenshots. Text inputs get a 1px frame (white on the white bar).
- **Frames for images:** the detail banner has a bottom separator and the
  image editor's preview a 1px frame, in both themes (images often have a
  white background).
- **No drop shadows:** the legacy `button[class]` style had one (e.g. the
  backup view's Older / Newer bars); it's gone. Dropdowns, popovers and
  menus keep their elevation shadow.
- **Image editor:** the layer's Remove is a labelled destructive button,
  "Remove Layer"; Reset reads "Reset Layer".
- **MiSTer Sync**, rebuilt on our components. **Connect** is a modal
  (`misterSync/connect.tsx`) over Backups: `Field`s with `TextInput`s (the
  password is a password field now), the three requirements in one info
  `Callout`, a warning when connecting fails (nothing was shown before),
  Cancel / Connect. The **session** (`misterSync/index.tsx`) is a page:
  saves by platform on the left (rows as buttons, the chosen one marked),
  the comparison on the right: game name, a status tag (same, newer on the
  Pocket / MiSTer, not on the MiSTer yet), Pocket and MiSTer side by side
  (changed, checksum, path; the newer one framed in the accent), a folder
  `Select` when a save could go into several, and Copy to Pocket / Copy to
  MiSTer (the suggested direction primary; asks before replacing). An
  unmapped platform is a warning with Save Mapping. The log is a folded
  "Activity" strip. Data and actions come from a `MisterSource`
  (`misterSync/source.tsx`): the backend, or a demo. Save Mapping's
  buttons are ours.
- **Preview (Settings → Developer → Modal previews → MiSTer Sync):** made-up
  saves covering each case (same, older, newer, missing, two folders, not
  mapped); the host "fail" fails to connect; copying changes the demo's
  data and writes to the activity. Save Mapping is left out (it reads the
  MiSTer's folders). The stored login isn't touched.
- **Style name:** "Straight" (after "Rounded", which didn't fit a 2px
  radius, and "Clean", which judged the other again).
- **German:** every string uses "du" (42 were "Sie"), including older
  ones.

Twenty-ninth pass (2026-10-16, after review):

- **Style name:** "Modern" reads as "Straight" in every locale (the setting's
  value stays `modern`, so stored choices keep working). The rest of this
  plan still says "Modern" for it.
- **Slanted focus rings** sit on the edge (2px inward from it, no gap),
  not inset with a gap of the control's colour; outside isn't possible,
  since clip-path clips it. Modern / Straight keeps its outside ring.
- **Gaps between slanted controls:** two slanted edges side by side look
  the gap plus the slant apart, so rows of controls use `--control-gap`
  (`--space-sm` minus `--slant`; 8px in Straight): the header bar, its
  actions and filter group, and modal actions.
- **Filter divider** leans like the slanted edges
  (`rotate(atan2(--slant, control height))`), upright in Straight.
- **Home:** the twenty-seventh pass hid the Pocket too eagerly (in any
  narrow column, and below 860px beside the panel). It's only hidden when
  the window is short (≤ 700px) and the space beside the open panel is
  narrow (home view under 700px); otherwise it shrinks.
- **Update scene:** the Pocket was nearly black: its canvas used the
  default tone mapping (the home screen's sets `NoToneMapping`), and the
  layout puts it closer to the camera than its fixed point lights. It gets
  `NoToneMapping` and a stronger front light.
- **Platform page:** the games list takes the full reading width.

Twenty-eighth pass (2026-10-16, after review):

- **Filters in header bars:** every header bar with filters (Cores, Games,
  Save States, Screenshots, Plugins) sets them off with `ControlsGroup`'s
  dimmed line. It names itself ("Filters") and shows a tertiary **Clear
  Filters** while any filter is set. A set filter is marked like a pressed
  toggle: `Select active` and the `MultiSelect` trigger while something is
  chosen. Screenshots' Select (an action) moved to the right.
- **Info boxes:** `Tip` is gone; every hint and warning is a `Callout`
  (Home's "not a Pocket", the backup view, MiSTer Sync, core settings, the
  error screen). The core page's "0 of 1 required files found" is a
  warning `Callout`.
- **Zip install:** the file groups and "Remove duplicate existing files"
  are checkbox `Toggle`s, like Updatable; the info icon uses our `Tooltip`
  (focusable).
- **Cancel buttons of running jobs** (`jobs/button.tsx`, e.g. downloading
  required files with the remaining time) are our `Button`, at the end;
  the remaining time and speed are small soft text.
- **Palette swatches** (and the photo export's custom shades): a stronger
  border on hover, no lift.
- **Search fields:** the clear button is a small grey square (it inherited
  the global button shadow and press scale); side padding is half the
  space above and below the text plus half the slant (was 12px).
- **Games ↔ Platforms:** a system's name in Games opens its platform
  (when the card has its file); the platform page lists its games below
  its cores (`GameSystemSection embedded`).
- **Screenshot detail:** previous / next are tertiary.
- **Backups detail:** each save's heading is the game's name; the path
  (`Saves/…`) follows small, with a tertiary button that shows it on the
  SD card. Platform labels open the platform.
- **Photo export preview:** exporting works (the generated photos are
  saved to the chosen folder).
- **Update progress:** the phase spinner is 16px (the glyph is only
  pixel-perfect at 20 and 40, so it may look a little soft); the 3D scene
  gets an ambient and a key light under the Pocket's own; the footer keeps
  one height in every phase, since its changes resized the canvas and
  moved the Pocket. The demo only plays events; nothing is downloaded.

Twenty-seventh pass (2026-10-16, after review):

- **Photo export modal:** presets (GB, GB Player, Black & White) are
  buttons with their four shades, the active one primary; four custom
  shades as swatches; the chosen photo large with "Photo n of 30", the 30
  photos as a listbox of buttons (hover ring, accent when chosen, focus
  ring); Export Selected and Export All (primary) as modal actions.
- **Update progress modal:** the phases as steps (circle, spinner, green
  check) left of the animation; errors folded per phase ("n errors");
  `ProgressBar`s for the file and the total, speed and size, Skip as
  tertiary buttons; a Close button when done. The report has three columns
  (updated, installed, downloaded files) with cores as buttons to their
  page. The 3D scene and fly-through stay. Its events go through
  `update/modal/events.tsx` (Tauri by default). Also fixed: the skip
  warnings weren't awaited, so a skip always went ahead.
- **Previews (Settings → Developer → Modal previews):** the photo export
  with generated photos in the chosen colours (export off), and the update
  progress playing a scripted update (`update/modal/demo.tsx`: the card's
  cores, two "installed" ones from the inventory, an error in phases one
  and three) that holds at a chosen phase. Nothing is downloaded or
  changed; skipping does nothing.
- **Games without a core:** Games listed only systems an installed core
  declares, so a `.gb` in `Assets/gb/common` didn't show without a Game
  Boy core. Folders of known console platforms (gb, gbc, gba, gg, sms, nes,
  snes, genesis, pce, ngp, lynx, wonderswan) are listed too, with their ROM
  extensions and a built-in name when the card has no platform file; they
  get a "No core installed" warning tag and **Find a Core**, which opens
  Cores filtered to the platform.
- **Cores:** searching "gameboy" found no available cores (they were only
  searched by platform ID, identifier and owner); they're now searched by
  platform name, maker and category too. While searching or filtering,
  each section reads "Available (3 / 335)" and has its own "Nothing
  matches". Filtering was slow: every tile filtered itself (all re-render
  per key) and lazy tiles loaded in waves as others collapsed. Available
  cores are now filtered in the list from the inventory's data (only
  matches render), installed tiles render at once while filtering so the
  count is right, and the search and filters are deferred
  (`useDeferredValue`). New **License** (All / Free only / Needs a license)
  and **AI-ness** (All / None / up to 25 / 50 / 75%) filters, matching the
  tags (`passesTagFilters`). The filters are set off by a dimmed vertical
  line instead of the "/ Filters" label.
- **Palettes:** the no-games hint is an info `Callout`; saving no longer
  blanks the page twice (colours, share code and the games list keep their
  value while re-read: `keepPreviousOrSuspend`); the game select sits below
  the game, as wide as it, names cut off; swatches lift on hover and get a
  focus ring. The detail has a fixed header bar with Copy Share Code,
  Duplicate and Delete as full buttons (the bar that slides in on scroll
  never showed on such a short page).
- **Zip install modal:** the file groups (cores, platform files) and
  "Remove duplicate existing files" are `Switch`es; that option on the left
  (with an info icon for its explanation), Cancel (tertiary) and Install
  Files (primary) on the right.
- **Modals:** at most 800px wide. The update modal lays out by its own
  width (a container).
- **Tags and brand marks:** brand marks are 0.625 of the icon size (was
  0.75) and 0.8em next to text (was 1em), so the Analogizer mark is
  smaller everywhere. Tags use the buttons' padding ratio.
- **Save States** group by game by default. Names like "Pokémon" read
  "Pok‚mon": the Pocket stores them in code page 437 ("é" is 0x82), not
  Windows-1252; text that isn't UTF-8 is decoded as CP437 now.
- **Links:** `Link subtle` for titles (game and core section headers, the
  screenshot detail's game): no underline until hovered. Every link gets
  our focus ring instead of the browser's blue one.
- **Screenshot detail:** previous / next are icon buttons (focusable, with
  tooltips) fixed at the window's edges.
- **Search fields:** the browser's clear button is replaced by the pixel
  `close` icon.
- **Home:** the connected path is gone again (twenty-fifth pass). In short
  windows the Pocket's width is a share of the space beside the updates
  panel, and goes below 860px; in a very narrow column (under 420px) the
  Pocket is left out, so the title, stats and buttons keep their room.

Twenty-sixth pass (2026-10-16, after review):

- **Backups detail:** the rebuilt timeline from the twenty-fifth pass is
  reverted ("broken"); the original layout is back and cleaned up. Its
  column lines were drawn at `z-index: -1`, behind the page's background;
  the view is now its own stacking context (`isolation: isolate`) and the
  lines sit in a wrapper below the header bar and the hint, as 1px
  separators. Kept: backups sorted oldest first, the hint, dates (date over
  a soft time) sticking below the header bar, platform labels below them,
  version bars on the button radius (green Current; Older / Newer are
  buttons that read "Restore" on hover and focus).
- **Screenshots:** sections by game (default), core or date (by day,
  newest first), remembered (`ui_screenshots_group_by`). Game and Core
  filters (searchable) next to the search, which now also matches the core
  and file name. Section headers use the new `shared/groupHeader`
  (extracted from Save States): the game links to Games, the core to the
  core page, plus a count. `screenshotsInfoSelector` reads every
  screenshot's game, core and date once (kept while it reloads);
  previous / next in the detail follow the order on screen. The detail's
  game is a link too.
- **Games links:** until games have their own pages, a game opens Games
  searched for it (`useOpenGame`; Games' search is `gamesSearchAtom`).
- **Save States:** Group by Core (default) or Game, remembered
  (`ui_save_states_group_by`), and a Game filter. By game, the header links
  to Games and counts save states; by core it keeps the "( n / 128 )" (the
  Pocket's limit per core). Headers use `GroupHeader`.
- **Palettes list:** creating a palette showed the skeletons about three
  times: each file event re-ran the list (fallback: all skeletons), and the
  new tile's share code suspended the whole list. The list keeps the shown
  palettes while it reloads (`keepPrevious` in `utils/jotai.ts`, built on
  jotai's `unwrap`) and each tile has its own Suspense.
- **(r) Palette detail:** on `DetailPage`. The name is the title and edits
  in place (Enter or leaving the field renames; Escape undoes; folders show
  before it). Copy Share Code, Duplicate and Delete are icon buttons by the
  title and in the header bar. The game preview has our `Select` ("Game";
  the native select was empty without games) and a hint where to put a
  `.gb` game when there's none, with the palette's swatch preview instead.
  The emulator credit is small soft text below the game, not a banner.
  Colour sets are labelled rows of swatches (Obj0 / Obj1 read "Sprites 0 /
  1", "window" "Window"); Reset and Save are buttons, disabled until
  something changed. Rename, duplicate and delete live in
  `palettes/hooks/usePaletteActions.ts` for tiles and detail; renaming now
  keeps a palette in its folder (the tile moved it to the top).

Twenty-fifth pass (2026-10-16, after review):

- **Home:** the connected path from the twenty-fourth pass is removed
  again (too long); its strings are gone.
- **3D Pocket screen:** screenshots are drawn into a black 10:9 frame (the
  Pocket's 1600 × 1440 at half size) at the core's display aspect ratio
  (its video.json scaler mode, else the image's), as large as fits, so
  wider or narrower images get bars like on the device instead of being
  stretched (`frameScreenshot` in `three/randomScreenshotScreen.tsx`).
- **Screenshot dates:** `timestamp` was always "now" (the file's date of a
  `File` built in memory). It's parsed from the name the Pocket gives
  (`YYYYMMDD_HHMMSS.png`, local time), or null. The grid's hover drawer
  and the detail view show it.
- **Screenshot detail:** Save and Share have icons (`save`, new `share`).
  The image sits in its own area with the page padding; the info below
  has a separator, the game as title with the date beside it, then one
  soft line: platform · core (a link) · size · file name. The core used
  the old `CoreTag`.
- **Save state images:** the thumbnail canvas was 122px wide but the
  columns were drawn from x = 2, so a transparent 2px strip (the light
  media background) showed on the left. It's as wide as the 120 drawn
  columns now; the first stored column still isn't shown, as before.
- **Backups timeline (View Saves):** rebuilt. Backups are sorted oldest
  first (bars assumed that order, the list didn't guarantee it). One grid
  template for the dates, guides and rows: a name column, then a column per
  backup. Dates stick below the header bar, platform labels below the
  dates; a 1px guide runs down each backup's column (they were drawn at
  `z-index: -1`, behind the page's background). Bars: green "Current" for
  the version on the Pocket; the others are buttons that read "Older" /
  "Newer" and turn into "Restore" on hover or focus. File names drop the
  platform folder (they're grouped by it). A Tip explains how to read it;
  "Nothing matches" when the search or Hide Unchanged leaves nothing.
- **Sidebar groups:** Home; installed on the card (Games, Cores,
  Platforms, Palettes, Firmware); made on the Pocket (Screenshots, Save
  States); tools between card and computer (Backups, Fetch, Plugins).

Twenty-fourth pass (2026-10-16, after review):

- **Switching cards:** reads from the SD card are cached by their path on
  the card, so after connecting `/Volumes/…` instead of a folder the app
  kept showing the old folder's files (e.g. screenshots, which Home had
  already loaded). Connecting now marks every watched path as changed
  (`refreshAllFSWatchers` in `jotai/fileSystem/atoms.ts`), so everything
  is read again. The save state image read wasn't watched at all; it is
  now.
- **Home:** the connected folder or volume shows below the buttons
  ("Connected to …", monospace, cut off with the full path on hover). The
  "That folder doesn't look like …" hint is a warning below the Connect
  button, not beside it.
- **Save States:** the empty state explains saving (Analogue + Up) and
  loading (Analogue + Down, after turning on Settings → Memories → Enable
  Quick Load on the Pocket), each under its button combination, per
  Analogue's manual. Group headers show the core's full name
  (`Spiritualized.GBC`, a link to the core) and its platform's name, since
  the short name alone ("GBC") read like the platform; the Core filter
  lists full names too. The loading placeholders were 240px vertical card
  skeletons, so a dark wall flashed and collapsed into the short
  horizontal tiles; they now match the tile (a horizontal `CardSkeleton`,
  128px).
- **Backups detail:** "Hide Unchanged" off crashed on a save folder whose
  platform has no file on the card (`gbc`). The platform label falls back
  to the folder name.
- **Firmware:** "Jump to" is a menu button (new `ui/Menu` on Radix
  Dropdown Menu) instead of a select, since it holds no value. Items show
  the version and its date.
- **Palettes:** Add via Code uses `Field`, a code `TextInput` and the modal
  actions: Cancel, and a primary Add Palette that's disabled until the code
  is valid. The hint names the palette once the code parses; a wrong code
  shows an error. Enter adds. A malformed name no longer throws.
- **Modals:** no border; the radius stays `--radius-modal`.

Twenty-third pass (2026-10-15, after review):

- **Long names in tiles:** the archive source `ping-pong-diplomacy-gb-rom-v-1`
  broke the tile: the text column couldn't shrink (`min-width: auto` in a
  flex row), so the long title and `archive.org/details/…` link pushed the
  actions out. `tile__body` / `tile__open` get `min-width: 0`, subtitle
  links and fetch paths are one truncated line.
- **Palettes flicker:** the list's `Suspense` had no fallback (blank page,
  then tiles) and the previews none either (tiles jumped). Now skeleton
  tiles while the list loads, and a 5:4 placeholder per preview.
- **Spinner:** `SPINNER_FRAME_MS` is 160.
- **Select** no longer scales on press: its trigger is a classed `<button>`
  and picked up the legacy `button[class]:active` scale.
- **Updatable filter:** only installed cores checked it, so the whole
  Available list stayed; not-installed cores now hide while it's on.
- **Search fields:** pressing anywhere in a `TextInput`'s frame (icon, key
  caps, padding) focuses the field; buttons and links inside keep their
  clicks.
- **What's New:** the release date moved out of the heading onto its own
  soft line, formatted with `toLocaleDateString()` like the other dates.
  The bullets are inset now (the side-padding rule out-ranked the list
  rule; it's `:where()` now, without specificity).
- **Library Updates:** "Last updated … ago" sits on its own line under the
  source, left aligned and small; the panel title uses the rows' padding.

Twenty-second pass (2026-10-15, after review):

- **"Nothing matches":** `ui/NoResults`, a soft line with a search icon,
  last inside a `.search-results` wrapper. Pure CSS: it shows once the
  wrapper holds no tiles, game sections, screenshots or loading
  placeholders, so the lists that hide their own items need no count. On
  Cores, Platforms, Games, Save States, Screenshots and Plugins (only when
  there are items at all; otherwise the `EmptyState` shows). Cores also
  hides the heading of a section the search emptied.
- **Fetch status didn't refresh:** file events notify paths without a
  leading slash ("Fetch Example"), but fetch watched "/Fetch Example".
  `fsWatchAtomFamily` now normalises paths (leading / trailing slashes;
  "/" stays the root), which fixes any watch with a leading slash. Refresh
  Status now re-reads local sources too (it only re-checked archive.org).
- **Fetch status text:** "All 5 files up to date" (green), "2 of 5 files
  to fetch" (yellow when some are there; newer files at the source count as
  to fetch), "No files found". **Last fetched … ago** in the meta line,
  stored on this computer per source (`fetch_last_run`), since the SD
  card's config has no field for it.
- **Fetch tile:** the icon sits at the top left; Fetch Files is secondary;
  a tertiary **Open Folder on SD Card** icon button opens the destination.
  Run Plugin is secondary too; the plugin logo also sits at the top.
- **`ui/ProgressBar`:** a framed rectangle with the shared radius, a solid
  accent fill 2px inside, the label (cut at the start, so file names show)
  and percentage above, an indeterminate mode, reduced motion respected.
  `ProgressLoaderInner` renders it, so Fetch, Firmware and the GB palette
  conversion use it; the update and zip install modals still have their
  own bars ((h)).
- **Loading preview** (Settings → Developer, dev builds): both spinners at
  40 and 20px with a speed slider (16–400ms per frame, preview only), and a
  determinate and an indeterminate progress bar. `Spinner` takes
  `frameMs`. (`SPINNER_FRAME_MS` was 16 in the code; set back to 160 in
  the twenty-third pass.)
- **What's New:** paragraphs and list items are explicitly body colour,
  sub-headings ("Fixes", …) headline at the body size, and lists keep their
  bullets inside the side padding (the 12px padding had replaced the list
  indent).
- **Library Updates:** the list's extra 10px side padding is gone, so rows
  line up with What's New; each row shows the core's platform image (from
  the inventory) on the left and an **Installed** tag when the core is on
  the SD card.
- Strings: `app.no_results` and the new fetch strings in every locale; the
  loading preview is English only (dev tool).

Twenty-first pass (2026-10-15, after review):

- **Tooltip:** its own line height (`1.4`; `:root`'s fixed 24px made the
  12px label as tall as a button) and the buttons' ratio: side padding
  1.35× the vertical space plus half the slant.
- **Pocket Colours** on Home is a tertiary icon button (tooltip "Pocket
  Colours"), so it doesn't compete with Disconnect. `about.colours` is
  removed in every locale.
- **Plugin tiles** span the full width (descriptions and links were cut
  off in columns), with a 120px logo.
- **Plugin window:** it now applies the theme and style itself (it's a
  separate webview; the settings are files, so it reads the same ones), and
  its native title bar follows the theme. The log is a framed code panel in
  the theme's colours instead of a white box; the plugin's questions use
  `Button` (choices) and `TextInput` + a primary Submit.
- **What plugins are:** small WebAssembly programs from a GitHub release,
  shared with other Pocket updaters (e.g. pupdate). They run sandboxed with
  access to the SD card, a private data folder on the computer and the web
  hosts their `plugin.json` allows; they print a log, ask multiple-choice or
  text questions, and can open links. The example plugin only shows the
  flow. Worth a sentence on the Plugins page; see Waiting on.
- **Example fetch sources** (not in the repo): two added to the test SD
  card's `pocket-sync.json` for reviewing the styling, a local folder and
  an archive.org item, both into an empty `/Fetch Example` folder.

Twentieth pass (2026-10-15, after review):

- **What Play does:** it opens the plugin in its own window (600 × 900,
  always on top), where the plugin runs, asks its questions and works on
  the SD card; the button shows that it's running until the window closes.
  It's now a primary **Run Plugin** button (play icon, "Running…" and
  disabled while open).
- **Plugin tiles:** `Tile orientation="horizontal"` with the logo (or a
  plug icon), the name as the title (18px in horizontal tiles), the
  repository as a soft link, the description, the version as meta, and Run
  / Remove (destructive icon button) as actions. Grid columns of at least
  380px.
- **Plugin search and filter:** a search over name, description and
  repository, and an **Author** filter (the GitHub owner) once plugins come
  from more than one author. Plugins have no other data worth filtering by
  (name, description, version, URL only).
- **Add plugin modal:** a `Field` with label, hint (the release needs
  `plugin.wasm` and `plugin.json`) and error, a code-style `TextInput`
  (Enter submits), Cancel / Verify & Install as `Button`s, a "Checking…"
  state.
- **Fetch sources:** horizontal tiles with an icon (folder or archive), the
  folder or archive name as the title, the full path (cut at the start) or
  the archive.org link as the subtitle, "To … on the SD card" and the
  extension filter as meta, the file count as a tag (green with a check
  when complete, yellow when partial) or the progress while fetching, and
  Fetch Files (primary while files are missing) / Remove as actions.
- **Add Fetch Source modal:** an intro saying what Fetch does, then fields
  with labels and hints: Source (Local Files / Internet Archive, each
  explained), Folder on This Computer (subfolders are copied too), Archive
  Name (the part after archive.org/details/, with an example; checked
  against archive.org half a second after typing stops, with a found / not
  found line), File Extensions (optional, as removable chips; what leaving
  it empty means), the zipped-archives note as an info `Callout`, and
  Folder on the SD Card (e.g. `/Assets/gb/common`). Folder fields show the
  choice in a code frame next to a Choose Folder button. Add Fetch Source
  stays disabled until the source is complete.
- **New primitives:** `ui/Field` (label, control, hint or error),
  `modal--form` (a readable width, content height) and `modal__actions`
  (dismiss first, main action last). `Tile` got an optional `media`, a
  `description` slot and `tile__icon` for items without a picture; its
  subtitle is soft. The `play` icon is registered.
- Strings: the new ones are translated in every locale. Now unused (for
  (h)): `fetch.loading`, `fetch.new.archive_name`, `.origin`,
  `.destination`, `.extensions`, `.close`.
- **Game names and images:** asked how hard it would be; written up as
  milestone (s).

Nineteenth pass (2026-10-15, after review):

- **Home doesn't scroll:** the column's last-resort scrolling is gone
  (`overflow: hidden`). Instead of guessing the Pocket's size from the
  window height (`100vh - 340px` minus banners), it sits in
  `about__pocket-area`, which takes the height left after the title,
  banners, stats and buttons (`container-type: size`), and is square at
  `min(100cqh, 100cqw, 520px)`. The compact layout (≤ 700px tall) keeps the
  Pocket beside the column (`display: contents` on the area).
- **Disconnect instead of Eject:** the home button uses Settings'
  "Disconnect Pocket" (`settings:disconnect.button`, already translated),
  since it only disconnects the folder; Eject comes with (k). The
  `about.eject` string is removed in every locale, and `about__eject` is
  `about__actions`.
- **Colour swatches:** `SelectOption.swatch` (a CSS colour) puts a small
  circle before the label, in the list and the closed select. The Pocket
  colour options use the 3D model's colours (`three/hooks/colours.ts`), in
  the home popover and in Settings. The "Colours" label stays: the popover
  sets body and button colours, and the editions (Classic, Transparent,
  Aluminium, …) are already its group headings.

Eighteenth pass (2026-10-15, after review):

- **Tabs keep the scroll position:** a tab opened for the first time
  (Settings, Releases) suspended up to the page's boundary, so the page
  turned into a loader and jumped to the top. Each tab now has its own
  `Suspense` with a loader, and the core page's tab panel is at least a
  screen tall, so switching to a short tab doesn't pull the page up.
- **Save state tiles:** back to the old layout (small image left, game and
  date beside it, camera export on the right) as `Tile
orientation="horizontal"`, so frame, background, radius, hover and
  selection stay shared. The image takes the Pocket screen's 10:9 again:
  save states are stored at the core's own resolution and stretched to the
  screen, which the vertical tile didn't do, so they looked distorted. The
  grid uses columns of at least 280px.
- **Regular font size is 16px** (`--font-size-md`, the root size). Settings
  use it throughout, now also for their notes (`Callout` is 14px
  elsewhere); the header bars' compact controls stay at 14px.
- **Line breaks in Settings:** the descriptions contain hard `\n` breaks
  mid-sentence (written for an older, narrow layout) and were shown with
  `pre-wrap`. They now read as spaces; the strings are unchanged. The
  `--collapse-spaces` modifier became redundant and is gone.
- **Games by system, checked:** it matches the SD card. Games live in
  `Assets/<platform>/` (mostly `common/`), shared by every core for that
  platform, so the old per-core list showed the same folder once per core
  (e.g. several Game Boy cores). Known gaps: cores whose games are
  `instance.json` files (CD and many arcade cores) are only listed through
  their data slot's extensions, so CD tracks can count as separate games
  and arcade sets may be missing; the system header doesn't say which
  cores play it yet.
- Removed an unused `SelectOption` import in Settings (the lint error noted
  earlier).

Seventeenth pass (2026-10-15, after review):

- **Light focus ring:** back to the Analogue green (`--theme-focus:
var(--theme-accent)`); the darker foreground green looked too dark next
  to the light green fills.
- **`ui/Tile`:** one card for every grid of items: media on top (full
  width, on the media background), title, subtitle (e.g. the author with
  `tile__avatar`), soft meta line, tags pinned to the bottom, optional
  action row. Card radius, hover lightens, `selected` draws a 2px
  selection frame, and the light theme's separator frame lives here. Without
  actions the whole tile is a `role="button"`; with actions, media and text
  become its open button, so the buttons aren't nested. `Grid`'s arrow-key
  navigation includes those open buttons. Cores, platforms, save states and
  palettes use it; the `cores__item` card styles are gone.
- **Save States:** tiles in a `Grid` per core (screenshot on top, game,
  date and time), like the cores; the Game Boy Camera export is a tertiary
  icon button ("Export Photos") in the action row. Groups with unloaded
  placeholders stay visible, so they still load. The sticky core headers'
  separator is inset like the header bar's.
- **Palettes:** tiles in a `Grid` (preview, name, actions); the page grows
  with its content, so the header bar stays sticky.
- **Icon buttons (slanted):** as wide as tall plus the slant, since the
  slant cuts into two corners and made them look narrow.
- **Settings type:** row titles are the one emphasised level (18px,
  semibold, headline colour); setting rows, their controls and descriptions
  use the regular 16px in body colour (rows were 18px, titles the browser's
  default `h3`, everything the same colour).
- **Header bars:** 12px vertical padding (was 8px), and the separator stops
  at the side padding instead of running edge to edge
  (`--header-bar-height` is 53px now).
- **Screenshots empty state:** centred in the whole window (`EmptyState
fullPage`; the page has no header bar). The button names in the hint are
  emphasised (`<key>` in the `how_to` strings, headline colour), in every
  language.
- **Focus rings in modern** follow the control's radius: a 2px inset shadow
  rounded with the radius plus the ring's 4px offset, instead of the
  rectangular clip-path frame (inputs, buttons, selects, toggles, tabs,
  switches, menu items).

Fifteenth pass (2026-10-14, after review):

- **Focus rings outside in the modern style:** `--shape-slant: none` there,
  so controls aren't clipped; corners come from `border-radius` (a modern
  rule in `style.css` listing the formerly clipped controls). The ring
  pseudo-elements use `inset: var(--focus-ring-inset, 0)`: 0 in the slanted
  style (ring 2px inside the edge, as clip-path requires), −4px in modern
  (2px gap, 2px ring outside). On green controls the ring uses the focus
  colour in modern (`--focus-ring-on-accent`), the text colour inside the
  shape in slanted. The settings menu got 4px of room so rings aren't
  clipped by its scroll area.

Fourteenth pass (2026-10-14, after review):

- **Dismissible notes:** `Callout dismissId="…"` adds a close button; the
  ids are stored (`dismissedNotesAtom`, `ui_dismissed_notes.json`).
  Settings → Display → Dismissed Notes shows them all again. Used for the
  Cores zip-drag tip and the Plugins info; warnings next to settings stay
  undismissible.
- **Callout look:** no coloured edge, card radius, icon centred on the first
  line (line height 1.5, icon offset (1.5em − 16px) / 2); Tip aligned the
  same way.
- **Home on short windows:** the column is centred vertically, with the
  Pocket beside it (absolutely placed). The grid version spread the Pocket's
  height over the right column's rows, so the text sat at the top.

Thirteenth pass (2026-10-14, after review):

- **Empty states** fill the page below the header bar and centre their
  content (minus room for a note above).
- **Info notes at the top:** the Plugins info and the Cores zip-drag tip
  are info `Callout`s (`callout--in-page`) right below the header bar.
- **Sidebar badges:** the firmware dot is the same 18px circle as the core
  count, just empty; both shrink to the same dot when collapsed.
- **Home on short windows** (height ≤ 700px): two columns, the Pocket left,
  title / stats / buttons right, toolbar in the corner; scrolls as a last
  resort, so the bottom buttons are never cut off.

Twelfth pass (2026-10-14, after review):

- **Firmware file not detected:** files at the top of the SD card (the
  firmware .bin, root files for the archive) only notified their own path,
  never the root that `downloadedFirmwareSelector` watches ("/"). Root-level
  changes now notify "/" too.
- **Firmware page:** full width, release-note text capped at
  `--content-max-width`. "Nothing waiting" is a quiet soft line with a green
  check. If the file on the card is the installer of the version already
  installed, it says so and offers "Remove Installer File". Accordion rows
  showed a padded strip when closed (`display: flex` overrode Radix's
  `hidden`); fixed in `Accordion`.
- **Demo firmware update** (dev only): Settings → Developer → "Pretend a
  firmware update is out" (`demoFirmwareUpdateAtom`).
- **`EmptyState`** (`ui/EmptyState`: icon, title, text, action): Fetch,
  Plugins, Palettes, Platforms, Save States (with the Analogue + Up combo for
  a memory), and Games, Backups, Screenshots moved onto it.
- **`Callout`** (`ui/Callout`, info grey / warning yellow, with icon):
  Settings' "turning this off…" and archive legal note, the display mode
  limit, Load Required Files' archive hint.
- **Save States:** one section per core (Cartridge first) with a sticky
  header on the page background below the header bar
  (`--header-bar-height`), overview padding, Core and Platform filters next
  to the search; emptied groups hide.
- **Home:** an icon button opens the SD card folder.
- **Games:** the category filter was the platform's category; there's no
  per-game category on the SD card. Replaced by a Platform filter; the
  system header shows its category as a tag, each game its file type.

Eleventh pass (2026-10-14, after review):

- **GamePocket glyphs, checked in the font:** the ligatures go up to
  `@key08@` (no `@key10@`). `@key06@` is the small round button, the same
  size as the Analogue button (`@key05@`): Start and Select. `@key07@` /
  `@key08@` are large filled / ring circles that overflow the glyph box
  (purpose unknown). `@key01@`–`@key04@` are single dots in a face button's
  place, so `ButtonCombo` and the keypad `Spinner` draw them over a dim
  `@key00@` cross. The D-pad glyphs are complete pads with the direction
  marked. Select is the small-button glyph as a ring (text stroke).
- **Games:** the list spans the full width, and every game row has a "Show
  in Folder" button that opens Finder / Explorer with the file selected
  (`revealFile`, opener plugin; allowed by `opener:default`).

Tenth pass (2026-10-14, after review):

- **Analogue green:** `--analogue-green: #84E38F` (the green Analogue uses
  for its buttons) is now the dark themes' `--theme-accent`, replacing
  `#63DB84`; dark text on it is 12:1. Light themes keep their darker green.
  **Figma:** the Theme variable `theme/accent` still has the old value.
- **`ButtonCombo`** (`ui/ButtonCombo`): a Pocket button combination drawn
  with the GamePocket glyphs, like Analogue's guides. The row of small
  buttons (Select ring, Analogue, Start dot) with the pressed ones lit and
  the rest dim, so Start / Select need no label; D-pad and face buttons as
  their glyphs; groups joined by "+". Screen readers get the names
  (`pocket_buttons` strings). Used for the screenshot hint (Analogue +
  Start) and the Inputs list (A / B / X / Y / Start / Select; L and R have
  no glyph and stay text).

Ninth pass (2026-10-14, after review):

- **Spinner** (`ui/Spinner`): the Pocket's D-pad (default) or face buttons,
  pressed in a circle (up, right, down, left; the first glyph of each set
  left out), 160ms per frame, still with reduced motion. `Loader` renders it,
  so every loading state in the app uses it; `Loader` no longer has a
  background (it takes the container's).
- **What's New:** the changelog is fetched once but rendered per release,
  10 at a time; the next 10 render when the end is within ~600px of the
  panel's scroll area.
- **Developer section** is listed in the settings menu in dev builds.
- **Tip icon:** 16px, like icons in buttons.

Eighth pass (2026-10-14, after review):

- **Toggles suspended:** `atomWithAppLocalStorage` reads always return a
  promise, so every write re-suspended the UI (loader instead of the sidebar
  and panel transitions). New `atomWithAppLocalSetting` returns the plain
  value after a write; theme, style, sidebar, news panel and last-read use
  it. The original helper is unchanged.
- **Focus rings:** `--focus-offset` (2px). Slanted rings sit 2px inside the
  edge (a gap of the control's colour), since clip-path can't show anything
  outside; on green fills (primary button, checked switch)
  `--focus-ring-colour` switches to the accent text colour. Outline rings
  inside clipped containers keep the same 2px gap.
- **Download graph:** each bar's numbers (release, downloads, days as
  latest) show in our Tooltip on hover; the pointer cursor is gone (no
  click action).
- **Demo flag (dev builds only):** Settings → Developer → "Pretend cores
  have updates" marks the first three installed cores as updatable
  (`demoCoreUpdatesAtom`, `demoUpdateCoreNamesSelector`), to preview tags,
  the Updates section, the sidebar count and the detail panel. Nothing on
  the SD card changes. Strings are English only (dev tool).
- **Image editor:** the layer's remove button is a destructive icon button.

Seventh pass (2026-10-14, after review):

- **Font sizes:** one scale in `theme.css` (`--font-size-2xs` … `-hero`,
  plus `-code`). Every hard-coded rem / px size in the app's CSS (44 files)
  now uses it, snapped to the nearest step (e.g. 15px → sm, 17.6px → lg).
  Only relative (em) and responsive sizes remain.
- **Modals:** focus goes to the dialog, not the close button, so its
  tooltip no longer covers the title on open. Escape closes only the modal
  (it used to reach the page's Escape-to-go-back too); clicking outside
  closes dismissible modals.
- **Image editor:** preview on top, layers below (thumbnail, labelled
  sliders, move up / down, reset, remove as real buttons), then Import /
  Cancel / Save. The old grid put the new modal header in a cell.
- **Switch:** the off track uses `--theme-control-off` (black in the dark
  themes); the thumb's inset is equal on all sides without a slant.
- **Tip:** our info icon, default size, soft colour.
- **Screenshots hint:** the Pocket's button glyphs from the font (40px),
  the plain button labelled "Start".
- **Sidebar:** no loading spinner when changing views.

Sixth pass (2026-10-14, after review):

- **Update page removed** (@olivierbrcknr's call): Cores has the Updates
  section with Update All. Lost with it: bulk-installing new cores with the
  author / category / AI-ness / license filters, and the saved filter
  defaults (`update_filter_options.json` stays on disk, unused). The
  `update` strings for the page are unused now. Kept: the progress modal
  (`update/modal`, its styles in `update/index.css`), `update/shared.tsx`
  and `useInstallAndUpdateCores`.
- **Sidebar badges:** Cores shows the number of core updates, Firmware a
  dot when a newer firmware is out (green; a dot on the icon when
  collapsed).
- **Unread library updates:** a green dot on the home panel's toggle while
  there are updates newer than the last seen (`ui_news_last_read`); opening
  the panel marks them seen. The panel's open state is stored as a file
  (`ui_news_panel_open.json`, verified on disk).
- **Modals:** always centred (`inset: 0; margin: auto`, no transform, so
  popovers inside keep working), also when a modal sets its own size.
  `ModalSuspense` shows the modal with its title, close button and a loader
  while its data loads; the data-loading modals wrap themselves in it, so
  the page no longer turns into a loader.
- **Load Required Files:** status as tags (Downloaded green with a check,
  Downloadable, Updatable, Not in archive red …), "Skip alternative files"
  is a Switch, Download All a primary button.
- **Buttons:** icon buttons are square (control height); buttons, selects
  and toggles have ~1.35× their vertical space as side padding, plus half
  the slant.
- **⌘F / Ctrl+F** turns on keyboard focus rings, so the focused search
  field shows its ring.
- **Overview padding:** section headings (`h2`), the card grid and tips use
  `--page-padding-inline`, like the header bar.

Fifth pass (2026-10-14, after review):

- **Modals** on Radix Dialog with a title and close button, see (f2).
- **Updates:** the next-steps panel gets an accent frame and an "Update
  available" title when there's an update. The Cores list starts with an
  "Updates Available (n)" section (the cores, plus **Update All**, which runs
  the same bulk updater and progress modal as the Update page, via
  `update/useInstallAndUpdateCores.ts`). Cards already carry the Update tag
  and the Updatable filter.
- **Screenshots:** the empty state shows how to take one: the Analogue
  button + Start (the firmware's "Menu + Start"; the manual calls the
  Analogue button "Menu").
- **Radii:** `--radius` (2px) with `--radius-button`, `-chip`, `-card`,
  `-input`, `-modal` pointing at it. Cards, accordion rows, notices, panels,
  key caps and modals use them. Slanted shapes can't show a radius; in the
  Modern style `--shape-slant` becomes `inset(0 round var(--radius))`, so
  controls round there. The old `--radius-sm/md/lg` are gone.

Fourth pass (2026-10-14, after review):

- **Detail page pattern:** no bar at the top. The back button floats on the
  banner; the sticky header bar (back, title, actions) slides in after a few
  pixels of scrolling. `DetailHeading` puts the title and its actions (icon
  buttons) on one row, with subtitle lines and tags below. The core and
  platform pages both use it; the platform page's Archive / Data Packs /
  Image Packs are icon buttons there and in the header bar. "Cores" reads
  "Installed Cores".
- **Icons:** brand marks (the Analogizer) now follow `size` like pixel
  icons (height 0.75 × size, width from the mark), and `size="text"`. One
  `Icon` component scales every kind of icon.
- **Drop overlay** renders on `<body>` (portal), so it covers the sidebar.
- **Persistence:** the window state was only saved on a clean quit (the
  frontend listened to a `resize` event that doesn't exist); it's now saved
  (debounced) on every move and resize. The webview's localStorage isn't
  kept between launches, so theme, style, sidebar collapsed and news panel
  moved to `atomWithAppLocalStorage` (JSON files in the app data folder,
  like other app settings).

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
- **Core cards (2026-10-14):** cards need tags (chips) that say whether a
  core is AI-made or an Analogizer core, using the different text levels;
  the version number should be smaller; and an installed core should show
  when an update is available, like the Update page.
- **Core detail layout (2026-10-14):** a responsive, multi-column grid. The
  information hierarchy was messy: status and facts belong on top, like the
  tags, including whether the core is installed. The creator wasn't shown.
- **Guidance (2026-10-14):** "for me it was not clear what i need to do when
  installing a core". One prominent Install button (not only in the header),
  Uninstall when installed, and Update when available.
- **Release notes (2026-10-14):** in a list like the other release notes
  (Firmware). Previous versions belong with the releases.
- **Background (2026-10-14):** the detail page was too dark; use the regular
  background, not black.
- **Inputs (2026-10-14):** the 3D Pocket input overview is fun and stays, but
  the button mapping should be easier to read.
- **Core settings (2026-10-14):** not in a modal; maybe tabs. Display modes
  belong with the settings; Info.txt belongs on the info (Overview) page.
- **Features (2026-10-14):** distil features into tags, so cores can later be
  filtered by them (e.g. RTC), if that's easily possible.
- **Modal bug (2026-10-14):** opening and closing modals (e.g. with Escape)
  left a modal that "stays somehow but not really".
- **Review 15 (2026-10-15):** asked what Clean Up Files and Build Instance
  JSON do and whether they're needed. The home screen's bottom buttons
  disappeared when a Pocket update was available. Radii of framed elements
  like the tab selector should be concentric (the outer frame's radius grows
  with the padding); "currently it looks a bit weird". The multi-select
  dropdown's buttons and popover didn't use the radius; make them
  consistent with the other buttons. The Cores section headings (especially
  "Updates available") weren't consistent; all sections need the same
  paddings. On the core page, the author "and any other elements that
  might be relevant" should be links. In Settings, the warning had no
  bottom margin, and the section menu was clipped by the padding at the top
  and bottom; the padding belongs inside. The light modern theme should be
  closer to the dark theme's colour separation (sidebar and background were
  the same colour). In light mode, destructive buttons weren't readable
  (white text, as in dark), the green looked too dark ("closer to the
  analogue green"), and core tiles need a border because the mostly white
  images blend into the background. Maybe tertiary buttons don't need a
  border in modern.
- **Review 23 (2026-10-16):** after connecting the real SD card instead of
  the mock folder, the app still showed the old files and no screenshots;
  the home screen could show the folder's or volume's path. The "That
  folder…" hint belongs beneath the Connect button. Save States' empty state
  should explain how to make and load a save state, like Screenshots'
  does. Asked what "View Saves" on a backup does ("I am not understanding
  the view"), so it can be shown better; Hide Unchanged crashed. Opening
  Save States flashed black. Wondered whether Backups ("a backup of the
  whole pocket, not on device like screenshots and savestates") and
  Palettes ("closer to games and platforms and cores as this is
  installable") belong elsewhere. Add Palette via Code had no submit
  button. In Save States, the cores showed only the platform, "this is
  confusing". Firmware's "Jump to" is odd as a select: "this should not be
  an element that can have a value". Modals should have no border and the
  radius used on buttons.
- **Review 29 (2026-10-16):** in light, screenshot tiles need a border,
  platform header images a bottom border "to make clear where the image
  ends", and the image editor's image a frame (both themes; "Images
  usually have a white BG"); the search input had no border; selected
  save states weren't green; the backup view's "older" button had a
  shadow: "we do not want drop shadows". The image editor's buttons should
  say "remove layer", "it is unclear atm". Sketch MiSTer Sync, add a mock
  to Settings, and "use our components (e.g. inputs) as much as
  possible". "Rounded seems like the wrong theme name with the simple 2px
  radius ... maybe clean?", "but clean might be too valued again". German
  "sometimes 'du' and sometimes 'sie'. Let's use informal only".
- **Review 28 (2026-10-16):** Home was "visually more broken": the Pocket
  was hidden "even when there would be space"; the issue was only when
  height and width are both small. In the slanted style the filter
  dividers should be slanted too; "Two slanted elements after each other
  should have a reduced gap, the slanted edge automatically adds some gap
  visually"; focus rings on slanted elements should be "either outside or
  on the edge itself", not inset. The platform page's games list can be
  the full reading width. MiSTer Sync "looks weird. this might be better a
  modal? What other states do we need to consider here?". The update
  modal's Pocket was still pitch black. Find another name for "Modern": "It
  currently seems like it is diminishing 'slanted'. They should be
  perceived as equal".
- **Review 27 (2026-10-16):** in the install modal the info should use our
  tooltip ("faster") and the toggles should be checkbox toggles like
  Updatable ("I think this makes it more clear"). The required files line
  could be a yellow warning box. The modal with the remaining time still
  had an old cancel button. The palette hover's "vertical move is too
  much", only add the border. The filter separator belongs on all header
  bars with filters; in Screenshots, Select is an action and goes to the
  right. The search's clear button should be grey without a shadow, and
  the search has too much side padding. Cores needs a tertiary "clear
  filters" once filters are set: "it is not clear if a dropdown has a
  filter selected as they all look the same". Games should link to the
  platform, and platforms list their games below the cores. Prev / next
  screenshot should be tertiary ("too prominent"). "We should always use
  the info box for warnings and infos. this makes it easier to style them
  consistently." Backup saves need better headers with the game name, the
  path small with an open button, and platform links. In the demos, the
  photo export didn't export; the update spinner could be smaller, the 3D
  scene looked unlit, and the Pocket "positions itself differently all
  the time"; asked whether it actually downloads.
- **Review 26 (2026-10-16):** palettes: the no-games line should be an info
  box, saving reloaded the screen twice, the game select was very big and
  belongs below the preview, no wider than it, and the colours need hover
  and keyboard focus states; later, the detail's buttons belong in the top
  header bar as full buttons. A `.gb` in `Assets/gb/common` didn't show in
  Games without a core; a missing core should get a warning tag and a
  quick "find core" action, ideally with the platform filter. Searching
  Cores for "gameboy" showed "Available (335)" without any core: show "no
  matching results" and e.g. "(0/335)"; filtering cores "takes a while ...
  Isn't that only a client side filtering?". The "/ Filters" label should
  go ("a dimmed vertical line and some gap"); the AI filter is missing; it
  should be possible to filter for each visible tag, e.g. "only free"
  (license). Next: the photo export and update progress modals, "with
  additional testing views for them so that I can see and visually debug
  it". Save states should group by game by default; "pokémon" rendered as
  "pok,mon". Title links shouldn't be underlined ("This is too much");
  screenshot prev / next need focus; focused links were still blue. On a
  narrow Home with the updates open, "the info is more important ... than
  the 3d scene". The install core modal's buttons: the checkbox to the
  left, Cancel and Install on the right, Install primary; the "platform
  files" toggle should behave like the other toggles; modals at most
  800px; the Analogizer icon in tags is too big, and tags could use the
  buttons' padding ratio; the search's clear button should be a pixel
  icon.
- **Review 25 (2026-10-16):** screenshots should link to their game
  ("later it might make sense to have game detail pages with screenshots
  and saves etc"), and the overview could have sections "by game, or core,
  or date so that it can be sorted", by game by default, with filters "as
  in the other overview pages". Save states should be sortable by game and
  have a game filter. The rebuilt backup view was broken: "let's use the
  existing one and clean it up a bit so that it is visible". Creating a
  palette refreshed the skeletons about three times. Palette detail: the
  game dropdown had no value, the emulator credit "could be a smaller info
  without the black banner", the name should be editable directly, and
  Copy Share Code and Duplicate belong in the header. Asked which screens
  from the README are still to check (e.g. Update All, photo export).
- **Review 24 (2026-10-16):** the connected path on Home "is too
  lengthy"; remove it. On the 3D Pocket, screenshots "can be smaller than
  the actual frame due to the different aspect ratio. They should not be
  stretched but put into a black frame so that it would get bars, like the
  real analogue pocket". Screenshots should show when they were taken
  (from the file name or metadata). Save state images had a white border
  on the left. The screenshot detail's Save and Share need icons, and the
  bottom drawer a clean-up. In View Saves "the lines and backgrounds are
  missing, that was visible in the previous non-designed version". The
  sidebar can be regrouped "in groups that make more sense" (after the
  earlier question about Backups and Palettes).

  `ping-pong-diplomacy-gb-rom-v-1` didn't display correctly; the Palettes
  page flickered while loading; the spinner should be 160ms; the fetch
  source dropdown scaled on press, which looked off for such a big control;
  the Manage Data Packs and Image Packs modals still need a pass; the
  Updatable filter on Cores did nothing; clicking the search field's key
  caps didn't focus it ("clicking anywhere on the input should focus the
  input field"); in What's New the date belongs on its own dimmed row in the
  app's date format, and the bullets still weren't inset; the library
  updates' "… ago" should be left aligned and smaller.

- **Review 21 (2026-10-15):** add empty states when a search or filters
  leave nothing, e.g. a simple line like "there is no entry matching your
  search / filters". Fetch said 0/1 files after fetching; maybe show the
  last fetch time or whether updates are there. Align the fetch icon top
  left, make Fetch secondary, maybe add "open directory" for the fetched
  files. A new loading bar matching the app's vibe, rectangular with the
  same radius and a clear bar, e.g. for fetch downloads. Run Plugin should
  probably be secondary. Show the loading spinner somewhere to debug its
  speed. What's New should use the body colour for text, and its list items
  weren't inset. Library updates were too inset and should get a reference
  image of the core they update, maybe with a tag if it's one the user has.
- **Review 20 (2026-10-15):** the tooltip's vertical padding was too large;
  match the buttons' ratio. The Home colours button could be an icon button,
  so it isn't too prominent. Plugin tiles can be full width, otherwise things
  get clipped, and the logo was too small. Asked for an example fetch source
  to see the styling. Running a plugin opened a window that didn't use the
  app's theme ("still a bit irritated what a plugin actually does"). Box art
  is tackled separately, maybe in a separate PR, with a reminder when we
  work on it again.
- **Review 19 (2026-10-15):** the plugin tiles should use our tile system
  and buttons; asked what the play button does. The plugin title should be
  "more title-y" and the rest softer, like the cores; add search and
  filters that make sense. The Fetch page lacked styling, especially the
  modal: "I am not sure what to enter where, so maybe some explanations are
  missing." Asked how difficult it would be to show the correct names and
  images of games, whether there's a public library for it, or whether
  it's in the files.
- **Review 18 (2026-10-15):** the home page could scroll, which shouldn't
  be possible. "Eject" on the home screen should be called "Disconnect" as
  in Settings, since eject isn't implemented yet, to avoid confusion. Maybe
  label the colours button "Edition", or leave it; the dropdown should show
  a colour example, like a little circle.
- **Review 17 (2026-10-15):** clicking a tab on the core page scrolled
  back to the top; it should keep the scroll position. The old save state
  tiles were better as a layout: "I wanted only the frame (and maybe
  background) of a tile to be unified so that we do not have issues with
  background edges"; otherwise the image needs the Pocket screen's aspect
  ratio (the screenshots were distorted). Asked what the regular font size
  is (14 or 16px); the settings should follow it, and some line breaks
  shouldn't be there. Before the redesign, games were listed by core,
  "which did not make sense in my opinion"; asked to check whether the new
  grouping makes sense. Asked for example Fetch and Plugin entries to
  review their styling.
- **Review 16 (2026-10-15):** in the slanted style, icon buttons should be
  roughly square too. Settings' font styles felt "a bit random": settings
  and their inputs belong in the regular size, and the default text colour
  should be body; "currently everything seems to have the same font
  colour". Header borders shouldn't run all the way through but respect the
  side padding, and the header rows' vertical padding can be closer to the
  horizontal one ("it seems a bit squished"). The screenshots empty state
  wasn't vertically centred, and the words tied to buttons ("Analogue
  button", "Start") should be emphasised. Focus outlines on inputs ignored
  the border radius. Save state tiles should be in a grid like the cores,
  with rounded corners, and palettes too: "we likely should have a unified
  style for tiles in general, so it is consistent across the app". The
  palette detail screen should be tackled eventually. On light, the darker
  focus ring looked off.
- **Review 14 (2026-10-14):** focus outlines should be offset outside if
  possible, at least in the modern style; in the slanted style it's fine on
  the edge if the slant prevents an offset.
- **Review 13 (2026-10-14):** info boxes could be dismissed, stored, and
  resurfaced from the settings; no left border, the icon aligned with the
  first line, border radii. The compact home screen should be centred
  vertically.
- **Review 12 (2026-10-14):** empty states centred; the Plugins info at the
  top like the zip-drag info, which should be an info component (not a
  warning); the firmware dot the same size and position as the core count;
  the home screen cut off its bottom buttons on short windows, maybe side by
  side.
- **Review 11 (2026-10-14):** a pretend firmware update; empty states on
  every page without one; sticky save state section headers in the page
  colour with the overview padding, and filters (platform, core); firmware
  accordions full width with capped text, and no strip when closed; the "no
  firmware waiting" note was too prominent (soft, with a check); a
  downloaded firmware of the installed version still showed "nothing
  waiting" (say it's the current one and offer to remove it); an icon
  button on the home screen to open the SD card; game categories don't
  make sense, show tags and offer a platform filter. Warnings like
  "turning this off…" belong in an information component with an info or
  warning icon and grey or yellow colour.
- **Review 10 (2026-10-14):** Start and Select are probably the glyph after
  the Analogue button; what the large buttons are is open. The Games list
  should use the full width, and each game row needs an open-folder button
  to locate its file.
- **Review 9 (2026-10-14):** Analogue's button green is `#84E38F`: use it,
  or at least keep it in a variable. To avoid labelling buttons, Analogue
  shows the row of buttons with the pressed one highlighted: a component
  that takes a key combination and draws the relevant buttons with the
  font, e.g. "start" shows all three small buttons with Start lit,
  "analogue + start" lights both.
- **Review 8 (2026-10-14):** What's New slowed everything down by
  rendering all of it: lazy-render 10 at a time near the end, without
  refetching; its loading state had a different background than the panel;
  a custom spinner looping through the D-pad or key pad glyphs (without the
  first of each), one as default, used for every loading spinner; couldn't
  find the demo switch; the tip icon was still too large, it should have the
  buttons' icon-to-text ratio.
- **Review 7 (2026-10-14):** opening / closing the sidebar and the updates
  panel re-rendered with a loader instead of transitioning (it worked
  before); focus outlines need a 2px offset to be clear (invisible on an
  active switch); the download graph had a pointer but no action; a demo
  flag to see a core with an update; the layer remove button should be a
  destructive icon button.
- **Review 6 (2026-10-14):** no loader in the sidebar on page changes; the
  screenshot hint should use the Pocket's button glyphs, not key caps, with
  a label for buttons that aren't distinct (like Start); the off switch was
  invisible on its background, make it black, and equal padding in the
  modern style; the modal close button's tooltip covered content on open;
  Escape should close the modal (it needed two presses and then left the
  page) and clicking outside should close too; the image editor layout was
  broken; tips should use our icons, the default size and soft colour; font
  sizes should come from defaults defined in one theme file.
- **Review 5 (2026-10-14):** icon buttons square, a bit less side padding
  on buttons; a visible focus on the search after ⌘F; remember the updates
  panel and show a green notification dot for new updates (store when the
  user last read them); overview pages should use the padding variable;
  modals always centred, and showing their own loading state instead of
  the screen going black; Load Required Files with a green "Downloaded" tag
  and our own checkbox. "I think we can remove the updates page", with a
  counter in the menu for core and firmware updates.
- **Review 4 (2026-10-14):** the pack modals weren't Radix; one modal
  component with a close icon button (top right) and a title, for a
  consistent UX. An available update should be emphasised on the core page,
  and tagged and filterable on the overview. Asked whether the Update page
  only shows cores and could move into the Cores page. Screenshots' empty
  state should say how to take one on the Pocket. General radii for buttons,
  chips, cards etc., 2px by default (may change).
- **Core page review 3 (2026-10-14):** special icons like the Analogizer
  should go through the one icon component so they scale the same; the
  drop overlay has to sit above everything, including the sidebar; window
  size / position and the theme weren't kept on reopen; on the platform
  page, the actions (as icon buttons) belong on the title's row, with the
  same header bar treatment as the core page, as the pattern for detail
  pages; "Installed Cores" makes the list clear; the back button should be
  a single button on the image (no bar at the top), and the bar can appear
  earlier and stay sticky.
- **Core page review 2 (2026-10-14):** tags should be able to carry icons
  sized relative to their text (the Analogizer icon was too big); asked
  whether core settings save on change; the release install button belongs
  in the accordion's title bar; the 3D Pocket trapped the mouse wheel; link
  to a core's platform; the Platforms list and detail should follow the new
  layout; on the core page, the header bar should only appear on scroll,
  with the back button above the image; a platform filter for cores; a
  ⌘F / Ctrl+F search shortcut, shown as key caps that react to key presses;
  the drag-a-zip tip belongs at the top; manually installed cores (not in
  the list) get a "Manual" tag; dragging a file over the window needs a
  "drop here" overlay.
- **Core page review (2026-10-14):** the Analogizer tag can be Analogizer
  blue; releases get a tertiary "install this release" button; the big image
  banner should stay on top; only show features that are available, not
  struck-through ones; missing images need at least a default colour; the
  platforms should connect to the core better; the core name (and platform)
  can go back into the header; the page's side padding should match the
  header so it lines up, as a variable. Asked whether "Hide Core" is useful.

## Open questions

- Should a light theme be part of the first PR, or come after the
  foundations land?
- Translations were written by AI (see the disclosure): should the PR ask
  native speakers to review them?
- Should `CLAUDE.md` be added to the repo with a pointer to this plan? It
  helps future sessions, but would ship upstream unless excluded.
