# Changelog
<a id="v5.9.0"></a>
# [v5.9.0 - Framework updates, restores some things like saving window state](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.9.0) - 2025-09-23

## What's Changed
* Updates all Tauri things by [@neil-morrison44](https://github.com/neil-morrison44) in [#403](https://github.com/neil-morrison44/pocket-sync/pull/403)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.8.0...v5.9.0

[Changes][v5.9.0]


<a id="v5.8.0"></a>
# [v5.8.0 - OpenGPGA Library update, Gameboy Camera Gold support](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.8.0) - 2025-08-16

## What's Changed
* Adds gameboy camera gold by [@neil-morrison44](https://github.com/neil-morrison44) in [#401](https://github.com/neil-morrison44/pocket-sync/pull/401)
* Switches everything to OpenFPGA Library instead of Core Inventory by [@neil-morrison44](https://github.com/neil-morrison44) in [#402](https://github.com/neil-morrison44/pocket-sync/pull/402)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.7.5...v5.8.0

[Changes][v5.8.0]


<a id="v5.7.5"></a>
# [v5.7.5 - Fixes UI glitching on background refresh & improves 3D Pocket lighting](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.7.5) - 2025-05-27

## What's Changed
* Lights the 3D Pocket using 3 Point lighting & fixes UI gltich on refresh by [@neil-morrison44](https://github.com/neil-morrison44) in [#390](https://github.com/neil-morrison44/pocket-sync/pull/390)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.7.4...v5.7.5

[Changes][v5.7.5]


<a id="v5.7.4"></a>
# [v5.7.4 - Fixes issue opening folders on Windows](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.7.4) - 2025-05-25

## What's Changed
* Fixes issue opening Games folders on Windows by [@neil-morrison44](https://github.com/neil-morrison44) in [#389](https://github.com/neil-morrison44/pocket-sync/pull/389)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.7.3...v5.7.4

[Changes][v5.7.4]


<a id="v5.7.3"></a>
# [v5.7.3 - Fixes issue configuring MiSTer save sync](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.7.3) - 2025-05-18

## What's Changed
* Fixes issue entering text into MiSTer sync inputs by [@neil-morrison44](https://github.com/neil-morrison44) in [#386](https://github.com/neil-morrison44/pocket-sync/pull/386)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.7.2...v5.7.3

[Changes][v5.7.3]


<a id="v5.7.2"></a>
# [v5.7.2 - Fixes firmware update message showing when there isn't one](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.7.2) - 2025-04-28

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.7.1...v5.7.2

[Changes][v5.7.2]


<a id="v5.7.1"></a>
# [v5.7.1 - Fix Windows infinite loading bug](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.7.1) - 2025-04-28

## What's Changed
* Fixes issue where it loads forever in windows by [@neil-morrison44](https://github.com/neil-morrison44) in [#383](https://github.com/neil-morrison44/pocket-sync/pull/383)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.7.0...v5.7.1

[Changes][v5.7.1]


<a id="v5.7.0"></a>
# [v5.7.0 - big internal data management stability changes & QOL improvements](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.7.0) - 2025-04-27

Should fix the linux issues (by resetting most Tauri things to their previous known good version), and hopefully the Flatpak issue...
Moving from Recoil (which isn't maintained anymore) to Jotai (which is) is a massive change, but I think I've tested the app enough.

## What's Changed
* Swaps completely from Recoil to Jotai by [@neil-morrison44](https://github.com/neil-morrison44) in [#372](https://github.com/neil-morrison44/pocket-sync/pull/372)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.6.2...v5.7.0

[Changes][v5.7.0]


<a id="v5.6.2"></a>
# [v5.6.2 - like v5.6.1 but with the version number actually updated...](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.6.2) - 2025-04-12

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.6.1...v5.6.2

[Changes][v5.6.2]


<a id="v5.6.1"></a>
# [v5.6.1 - Potential fix for Linux issues](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.6.1) - 2025-04-12

## What's Changed
* Reverts the `async_walkdir` update by [@neil-morrison44](https://github.com/neil-morrison44) in [#381](https://github.com/neil-morrison44/pocket-sync/pull/381)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.6.0...v5.6.1

[Changes][v5.6.1]


<a id="v5.6.0"></a>
# [v5.6.0 - Inventory V3, roll cores back to previous versions, Turkish translation, also uses React 19](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.6.0) - 2025-03-30

## What's Changed
* Updates JS & Rust deps (React 19 etc) by [@neil-morrison44](https://github.com/neil-morrison44) in [#375](https://github.com/neil-morrison44/pocket-sync/pull/375)
* Update translations by [@sujade](https://github.com/sujade) in [#371](https://github.com/neil-morrison44/pocket-sync/pull/371)
* Bump apple-actions/import-codesign-certs from 3 to 5 by [@dependabot](https://github.com/dependabot) in [#374](https://github.com/neil-morrison44/pocket-sync/pull/374)
* Bump tauri-apps/tauri-action from 0.5.18 to 0.5.20 by [@dependabot](https://github.com/dependabot) in [#373](https://github.com/neil-morrison44/pocket-sync/pull/373)
* Bump actions/checkout from 3 to 4 by [@dependabot](https://github.com/dependabot) in [#364](https://github.com/neil-morrison44/pocket-sync/pull/364)
* Improves display of cores without images by [@neil-morrison44](https://github.com/neil-morrison44) in [#376](https://github.com/neil-morrison44/pocket-sync/pull/376)
* Switches to Inventory V3 by [@neil-morrison44](https://github.com/neil-morrison44) in [#377](https://github.com/neil-morrison44/pocket-sync/pull/377)
* Allows installing older versions by [@neil-morrison44](https://github.com/neil-morrison44) in [#378](https://github.com/neil-morrison44/pocket-sync/pull/378)

## New Contributors
* [@sujade](https://github.com/sujade) made their first contribution in [#371](https://github.com/neil-morrison44/pocket-sync/pull/371)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.5.0...v5.6.0

[Changes][v5.6.0]


<a id="v5.5.0"></a>
# [v5.5.0 - Fetch Fixes, in-app changelog, Bulgarian, QOL fixes](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.5.0) - 2025-01-02

## What's Changed
* Fixes occasional issue where items in the "Fetch" page would fail to correctly scan the files & show "Loading..." forever. Also a speed bump to the file scanning.
* Fixes a few things that've been annoying for a while by [@neil-morrison44](https://github.com/neil-morrison44) in [#358](https://github.com/neil-morrison44/pocket-sync/pull/358)
  - The "next" and "previous" buttons in the screenshot view now actually do different things instead of both being previous
  - Image Packs are now sorted by most-populated & when looking at images for a single platform ones without that platform aren't shown
  - The "fetch" part will no longer incorrectly show progress bars on all items instead of just the one that's being fetched
  - If a core has multiple cores within a zip there's now UI for enabling each core individually. **Note:** this doesn't fix it silently downloading all the bundled cores when updating one.
  - Show MSX in the games list (or any core that has entries in data.json that aren't required but start with "Slot")
* Bulgarian language added by [@toto99303](https://github.com/toto99303) in [#357](https://github.com/neil-morrison44/pocket-sync/pull/357)
* Adds a way to view the changelog by [@neil-morrison44](https://github.com/neil-morrison44) in [#359](https://github.com/neil-morrison44/pocket-sync/pull/359)
  - "What's new?" button on the about screen


## New Contributors
* [@toto99303](https://github.com/toto99303) made their first contribution in [#357](https://github.com/neil-morrison44/pocket-sync/pull/357)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.4.0...v5.5.0

[Changes][v5.5.0]


<a id="v5.4.0"></a>
# [v5.4.0 - Smoother UI, .gbp palettes from .pal palettes, hide cores](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.4.0) - 2024-12-25

## What's Changed
* Adds a way to hide uninstalled cores & fixes annoying refresh jump by [@neil-morrison44](https://github.com/neil-morrison44) in [#352](https://github.com/neil-morrison44/pocket-sync/pull/352)
* Uses react transitions, updates deps, fixes height scroller by [@neil-morrison44](https://github.com/neil-morrison44) in [#354](https://github.com/neil-morrison44/pocket-sync/pull/354)
* Bump tauri-apps/tauri-action from 0.5.15 to 0.5.18 by [@dependabot](https://github.com/dependabot) in [#353](https://github.com/neil-morrison44/pocket-sync/pull/353)
* Adds a warning when you've got too many display modes active by [@neil-morrison44](https://github.com/neil-morrison44) in [#355](https://github.com/neil-morrison44/pocket-sync/pull/355)
* Adds support for deriving .gbp palettes from .pal ones by [@neil-morrison44](https://github.com/neil-morrison44) in [#356](https://github.com/neil-morrison44/pocket-sync/pull/356)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.3.0...v5.4.0

[Changes][v5.4.0]


<a id="v5.3.0"></a>
# [v5.3.0 - macOS notarisation & optional GitHub PAT token usage](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.3.0) - 2024-11-29

## What's Changed
* Adds workaround steps for macOS gatekeeper warning by [@nol166](https://github.com/nol166) in [#340](https://github.com/neil-morrison44/pocket-sync/pull/340)
* Just updates dependencies by [@neil-morrison44](https://github.com/neil-morrison44) in [#344](https://github.com/neil-morrison44/pocket-sync/pull/344)
* Try to get apple app notarisation working... by [@neil-morrison44](https://github.com/neil-morrison44) in [#345](https://github.com/neil-morrison44/pocket-sync/pull/345)
* Add support for using a GitHub PAT token by [@neil-morrison44](https://github.com/neil-morrison44) in [#346](https://github.com/neil-morrison44/pocket-sync/pull/346)

## New Contributors
* [@nol166](https://github.com/nol166) made their first contribution in [#340](https://github.com/neil-morrison44/pocket-sync/pull/340)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.2.0...v5.3.0

[Changes][v5.3.0]


<a id="v5.2.0"></a>
# [v5.2.0 - Adds auto-repair button & fixes exporting firmware 2.3 GB Camera photos](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.2.0) - 2024-10-13

## What's Changed
* Re-applies the fix for older (semi-unsupported) macOS versions
* Adds an auto-repair feature by [@neil-morrison44](https://github.com/neil-morrison44) in [#333](https://github.com/neil-morrison44/pocket-sync/pull/333)
* Handles photo export for post-2.3 save states by [@neil-morrison44](https://github.com/neil-morrison44) in [#335](https://github.com/neil-morrison44/pocket-sync/pull/335)
* Adds auto repairs for any JSON errors in Cores / Platforms (found on the TS side) by [@neil-morrison44](https://github.com/neil-morrison44) in [#336](https://github.com/neil-morrison44/pocket-sync/pull/336)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.1.0...v5.2.0

[Changes][v5.2.0]


<a id="v5.1.0"></a>
# [v5.1.0 - Gets the auto-update working again (oops)](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.1.0) - 2024-10-11

## What's Changed
* Fixes the auto-updater by [@neil-morrison44](https://github.com/neil-morrison44) in [#331](https://github.com/neil-morrison44/pocket-sync/pull/331)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.0.2...v5.1.0

[Changes][v5.1.0]


<a id="v5.0.2"></a>
# [v5.0.2 - Fix for "Unknown" file status error](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.0.2) - 2024-10-08

## What's Changed
* Fixes zip issue causing the "Unknown" message by [@neil-morrison44](https://github.com/neil-morrison44) in [#328](https://github.com/neil-morrison44/pocket-sync/pull/328)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.0.1...v5.0.2

[Changes][v5.0.2]


<a id="v5.0.1"></a>
# [v5.0.1 - Small patch bumping some dependencies](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.0.1) - 2024-10-06

## What's Changed
* Updates Cargo & NPM things by [@neil-morrison44](https://github.com/neil-morrison44) in [#327](https://github.com/neil-morrison44/pocket-sync/pull/327)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v5.0.0...v5.0.1

[Changes][v5.0.1]


<a id="v5.0.0"></a>
# [v5.0.0 - New Icons, Tauri Framework update, Coin-Op Patreon Keys, Vietnamese translation](https://github.com/neil-morrison44/pocket-sync/releases/tag/v5.0.0) - 2024-10-06

## Notes
- The one bit I can't test before this goes out is the auto-updater, so you might need to install this manually but that _should_ be a one off
- Once this is out I'll have a look at getting the Flatpak configuration up to date & generally improved
- New icons by [@AbFarid](https://github.com/AbFarid) 

## What's Changed
* Updates to Tauri 2 by [@neil-morrison44](https://github.com/neil-morrison44) in [#323](https://github.com/neil-morrison44/pocket-sync/pull/323)
* Update translations (Add Vietnamese) by [@anh-tuan](https://github.com/anh-tuan) in [#320](https://github.com/neil-morrison44/pocket-sync/pull/320)
* Fix some typos by [@ianstanton](https://github.com/ianstanton) in [#316](https://github.com/neil-morrison44/pocket-sync/pull/316)
* Switch to new icons & some other tweaks by [@neil-morrison44](https://github.com/neil-morrison44) in [#324](https://github.com/neil-morrison44/pocket-sync/pull/324)
* Adds Patreon Keys feature for the coin-op collection key by [@neil-morrison44](https://github.com/neil-morrison44) in [#326](https://github.com/neil-morrison44/pocket-sync/pull/326)

## New Contributors
* [@anh-tuan](https://github.com/anh-tuan) made their first contribution in [#320](https://github.com/neil-morrison44/pocket-sync/pull/320)
* [@ianstanton](https://github.com/ianstanton) made their first contribution in [#316](https://github.com/neil-morrison44/pocket-sync/pull/316)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.12.1...v5.0.0

[Changes][v5.0.0]


<a id="v4.12.1"></a>
# [v4.12.1 - macOS Ventura RegEx error fix](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.12.1) - 2024-09-12

## What's Changed
* Fixes regex issue with macOS Ventura by [@neil-morrison44](https://github.com/neil-morrison44) in [#315](https://github.com/neil-morrison44/pocket-sync/pull/315)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.12.0...v4.12.1

[Changes][v4.12.1]


<a id="v4.12.0"></a>
# [v4.12.0 - GBC Colours, Japanese Translation, New Display Modes, JT Analogizer update](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.12.0) - 2024-09-11

## Info
* There'll soon be a v5 release with a major update to the underlying framework this app uses (Tauri), improvements - particularly to Linux - are expected but there may also be bugs

## What's Changed
* Update translations ja by [@bigmoonur](https://github.com/bigmoonur) in [#305](https://github.com/neil-morrison44/pocket-sync/pull/305)
* Update german translations by [@sir-codealot](https://github.com/sir-codealot) in [#308](https://github.com/neil-morrison44/pocket-sync/pull/308)
* Add new display modes by [@davewongillies](https://github.com/davewongillies) in [#309](https://github.com/neil-morrison44/pocket-sync/pull/309)
* GBC Colours & JT Analogizer change by [@neil-morrison44](https://github.com/neil-morrison44) in [#310](https://github.com/neil-morrison44/pocket-sync/pull/310)

## New Contributors
* [@bigmoonur](https://github.com/bigmoonur) made their first contribution in [#305](https://github.com/neil-morrison44/pocket-sync/pull/305)
* [@sir-codealot](https://github.com/sir-codealot) made their first contribution in [#308](https://github.com/neil-morrison44/pocket-sync/pull/308)
* [@davewongillies](https://github.com/davewongillies) made their first contribution in [#309](https://github.com/neil-morrison44/pocket-sync/pull/309)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.11.0...v4.12.0

[Changes][v4.12.0]


<a id="v4.11.0"></a>
# [v4.11.0 - Adds support for changing the JOTEGO Analogizer config](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.11.0) - 2024-07-27

## What's Changed
* Adds support for changing the JOTEGO analogizer config by [@neil-morrison44](https://github.com/neil-morrison44) in [#303](https://github.com/neil-morrison44/pocket-sync/pull/303)

<img width="1109" alt="Screenshot 2024-07-27 at 18 52 19" src="https://github.com/user-attachments/assets/f41529a7-4d5d-47a6-b4e9-27bbbd75ef56">


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.10.0...v4.11.0

[Changes][v4.11.0]


<a id="v4.10.0"></a>
# [v4.10.0 - Aluminium pockets, cancellable jobs, download counts](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.10.0) - 2024-07-15

## What's Changed
* Show download count on core info pages by [@neil-morrison44](https://github.com/neil-morrison44) in [#297](https://github.com/neil-morrison44/pocket-sync/pull/297)
* Adds the aluminium colours by [@neil-morrison44](https://github.com/neil-morrison44) in [#298](https://github.com/neil-morrison44/pocket-sync/pull/298)
* Adds `Cancel` buttons to some long-running tasks by [@neil-morrison44](https://github.com/neil-morrison44) in [#299](https://github.com/neil-morrison44/pocket-sync/pull/299)
* Improved materials in the 3D Pocket by [@neil-morrison44](https://github.com/neil-morrison44) in [#300](https://github.com/neil-morrison44/pocket-sync/pull/300)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.9.1...v4.10.0

[Changes][v4.10.0]


<a id="v4.9.1"></a>
# [v4.9.1 - Improves applying multiple platform images / jsons at once](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.9.1) - 2024-05-28

## What's Changed
* Improves saving multiple images / data jsons by [@neil-morrison44](https://github.com/neil-morrison44) in [#291](https://github.com/neil-morrison44/pocket-sync/pull/291)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.9.0...v4.9.1

## Quick links:
- Mac: [Pocket.Sync_4.9.1_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v4.9.1/Pocket.Sync_4.9.1_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_4.9.1_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v4.9.1/pocket-sync_4.9.1_amd64.AppImage) [pocket-sync_4.9.1_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v4.9.1/pocket-sync_4.9.1_amd64.deb)
- Windows: [Pocket.Sync_4.9.1_x64-setup.exe](https://github.com/neil-morrison44/pocket-sync/releases/download/v4.9.1/Pocket.Sync_4.9.1_x64-setup.exe)

[Changes][v4.9.1]


<a id="v4.9.0"></a>
# [v4.9.0 - Fixes issues with image/data packs & improves file install process](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.9.0) - 2024-05-19

## What's Changed
* Update translations by [@auer1329](https://github.com/auer1329) in [#284](https://github.com/neil-morrison44/pocket-sync/pull/284)
* Adds locks to the file system to fix issues where write tasks cause read tasks to be called a lot by [@neil-morrison44](https://github.com/neil-morrison44) in [#282](https://github.com/neil-morrison44/pocket-sync/pull/282)
* Version bump & fix translation typo by [@neil-morrison44](https://github.com/neil-morrison44) in [#286](https://github.com/neil-morrison44/pocket-sync/pull/286)
* Changes the image pack stuff to read the variants from the releases by [@neil-morrison44](https://github.com/neil-morrison44) in [#287](https://github.com/neil-morrison44/pocket-sync/pull/287)
* Fix image pack loading by [@neil-morrison44](https://github.com/neil-morrison44) in [#288](https://github.com/neil-morrison44/pocket-sync/pull/288)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.8.1...v4.9.0

[Changes][v4.9.0]


<a id="v4.8.1"></a>
# [v4.8.1 - Actually shows the platforms on the platforms page again](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.8.1) - 2024-04-29

## What's Changed
* Fixes the platforms page by [@neil-morrison44](https://github.com/neil-morrison44) in [#276](https://github.com/neil-morrison44/pocket-sync/pull/276)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.8.0...v4.8.1

[Changes][v4.8.1]


<a id="v4.8.0"></a>
# [v4.8.0 - Data/Image Pack speedup, Portuguese translation, Analogizer icon](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.8.0) - 2024-04-28

## What's Changed
* Uses the nesitfy crate to clear some bits up by [@neil-morrison44](https://github.com/neil-morrison44) in [#265](https://github.com/neil-morrison44/pocket-sync/pull/265)
* Adds `NeoGeo_Analogizer` to the list of cores to ignore the instance files for by [@neil-morrison44](https://github.com/neil-morrison44) in [#269](https://github.com/neil-morrison44/pocket-sync/pull/269)
* Add `pt` (Portuguese) translations by [@reinaldosimoes](https://github.com/reinaldosimoes) in [#267](https://github.com/neil-morrison44/pocket-sync/pull/267)
* Adds option to not replace platform files by default by [@neil-morrison44](https://github.com/neil-morrison44) in [#270](https://github.com/neil-morrison44/pocket-sync/pull/270)
* Build merged platform zip by [@neil-morrison44](https://github.com/neil-morrison44) in [#271](https://github.com/neil-morrison44/pocket-sync/pull/271)
* Speed up showing custom platform options by [@neil-morrison44](https://github.com/neil-morrison44) in [#272](https://github.com/neil-morrison44/pocket-sync/pull/272)
* Splits out the files and folders invokes by [@neil-morrison44](https://github.com/neil-morrison44) in [#274](https://github.com/neil-morrison44/pocket-sync/pull/274)
* Adds an icon & a banner for the Analogizer cores by [@neil-morrison44](https://github.com/neil-morrison44) in [#275](https://github.com/neil-morrison44/pocket-sync/pull/275)

## New Contributors
* [@reinaldosimoes](https://github.com/reinaldosimoes) made their first contribution in [#267](https://github.com/neil-morrison44/pocket-sync/pull/267)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.7.0...v4.8.0

[Changes][v4.8.0]


<a id="v4.7.0"></a>
# [v4.7.0 - Fixes non-required files appearing in the required files list, adds sort option to the cores list](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.7.0) - 2024-03-16

## What's Changed
* Adds sorting options to cores list by [@neil-morrison44](https://github.com/neil-morrison44) in [#260](https://github.com/neil-morrison44/pocket-sync/pull/260)
* Restore previous behaviour of only showing files marked as Required by [@neil-morrison44](https://github.com/neil-morrison44) in [#259](https://github.com/neil-morrison44/pocket-sync/pull/259)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.6.1...v4.7.0

[Changes][v4.7.0]


<a id="v4.6.1"></a>
# [v4.6.1 - Bug Fixes (Vectrex files, Space Invaders), Progress bar when downloading firmware](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.6.1) - 2024-03-04

## What's Changed
* Fix bugs with newsfeed & core files & instance files & add progress bar for firmware downloads by [@neil-morrison44](https://github.com/neil-morrison44) in [#255](https://github.com/neil-morrison44/pocket-sync/pull/255)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.6.0...v4.6.1

[Changes][v4.6.1]


<a id="v4.6.0"></a>
# [v4.6.0 - Much faster assets checking, support for nested archive files, general bug fixes, French translation](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.6.0) - 2024-02-25

## What's Changed
* Start moving the whole required files process to Rust by [@neil-morrison44](https://github.com/neil-morrison44) in [#247](https://github.com/neil-morrison44/pocket-sync/pull/247)
* Adds fix for missing parameters (PC Engine CD core) by [@neil-morrison44](https://github.com/neil-morrison44) in [#249](https://github.com/neil-morrison44/pocket-sync/pull/249)
* Updates the progress bar system with something more flexible by [@neil-morrison44](https://github.com/neil-morrison44) in [#250](https://github.com/neil-morrison44/pocket-sync/pull/250)
* A couple of fixes to fetch by [@neil-morrison44](https://github.com/neil-morrison44) in [#251](https://github.com/neil-morrison44/pocket-sync/pull/251)
* Be more defensive when downloading github releases by [@neil-morrison44](https://github.com/neil-morrison44) in [#252](https://github.com/neil-morrison44/pocket-sync/pull/252)
* Bump tauri-apps/tauri-action from 0.4.5 to 0.5.0 by [@dependabot](https://github.com/dependabot) in [#246](https://github.com/neil-morrison44/pocket-sync/pull/246)
* Fixes issue where the UI would flash as it refreshed by [@neil-morrison44](https://github.com/neil-morrison44) in [#253](https://github.com/neil-morrison44/pocket-sync/pull/253)
* Fixes issue with the md5 data slots by [@neil-morrison44](https://github.com/neil-morrison44) in [#254](https://github.com/neil-morrison44/pocket-sync/pull/254)
* Add French translation by [@f00b4r0](https://github.com/f00b4r0) in [#242](https://github.com/neil-morrison44/pocket-sync/pull/242)

## New Contributors
* [@f00b4r0](https://github.com/f00b4r0) made their first contribution in [#242](https://github.com/neil-morrison44/pocket-sync/pull/242)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.5.1...v4.6.0

[Changes][v4.6.0]


<a id="v4.5.1"></a>
# [v4.5.1 - Hotfix for the new cores (stops ignoring files not marked readonly)](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.5.1) - 2024-02-16

## What's Changed
* Logs all panics, removes result/option logging by [@neil-morrison44](https://github.com/neil-morrison44) in [#243](https://github.com/neil-morrison44/pocket-sync/pull/243)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.5.0...v4.5.1

[Changes][v4.5.1]


<a id="v4.5.0"></a>
# [v4.5.0 - Adds a Palette browser, potential Windows install fix](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.5.0) - 2024-02-06

## What's Changed
* Adds Palette Browser by [@neil-morrison44](https://github.com/neil-morrison44) in [#238](https://github.com/neil-morrison44/pocket-sync/pull/238)
* Uses the archive version of the log plugin by [@neil-morrison44](https://github.com/neil-morrison44) in [#240](https://github.com/neil-morrison44/pocket-sync/pull/240)


<img width="1325" alt="Screenshot 2024-02-06 at 02 08 43" src="https://github.com/neil-morrison44/pocket-sync/assets/2095051/bfa8d84b-90b9-4143-b987-01f9250f415d">


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.4.0...v4.5.0

[Changes][v4.5.0]


<a id="v4.4.0"></a>
# [v4.4.0 - redoes the "Update All" process, adds little sponsor link,](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.4.0) - 2024-02-02

## What's Changed
* Redoes the Update All process by [@neil-morrison44](https://github.com/neil-morrison44) in [#235](https://github.com/neil-morrison44/pocket-sync/pull/235)
* feat: add localization editor by [@NilsJacobsen](https://github.com/NilsJacobsen) in [#229](https://github.com/neil-morrison44/pocket-sync/pull/229)
* Adds a really subtle link to the sponsor page on the top of the About page by [@neil-morrison44](https://github.com/neil-morrison44) in [#236](https://github.com/neil-morrison44/pocket-sync/pull/236)

## New Contributors
* [@NilsJacobsen](https://github.com/NilsJacobsen) made their first contribution in [#229](https://github.com/neil-morrison44/pocket-sync/pull/229)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.3.1...v4.4.0

[Changes][v4.4.0]


<a id="v4.3.1"></a>
# [v4.3.1 - Better error logging, fixes issue updating cores list / newsfeed, german translation](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.3.1) - 2024-01-28

## What's Changed
* Fixes some issues when updating the newsfeed / inventory when the app's open while the computer sleeps by [@neil-morrison44](https://github.com/neil-morrison44) in [#232](https://github.com/neil-morrison44/pocket-sync/pull/232)
* Augments all the `.unwrap()`s with a write out to the log by [@neil-morrison44](https://github.com/neil-morrison44) in [#233](https://github.com/neil-morrison44/pocket-sync/pull/233)
* Version bump, delete presets and settings, and a little sleep by [@neil-morrison44](https://github.com/neil-morrison44) in [#234](https://github.com/neil-morrison44/pocket-sync/pull/234)
* Add German translation by [@auer1329](https://github.com/auer1329) in [#228](https://github.com/neil-morrison44/pocket-sync/pull/228)

## New Contributors
* [@auer1329](https://github.com/auer1329) made their first contribution in [#228](https://github.com/neil-morrison44/pocket-sync/pull/228)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.3.0...v4.3.1

[Changes][v4.3.1]


<a id="v4.3.0"></a>
# [v4.3.0 - Adds error logging, minor UI tweak to Update All process](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.3.0) - 2024-01-23

## What's Changed
* Finally sets up logging by [@neil-morrison44](https://github.com/neil-morrison44) in [#226](https://github.com/neil-morrison44/pocket-sync/pull/226)
* Improves the update all toggles by [@neil-morrison44](https://github.com/neil-morrison44) in [#227](https://github.com/neil-morrison44/pocket-sync/pull/227)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.2.2...v4.3.0

[Changes][v4.3.0]


<a id="v4.2.2"></a>
# [v4.2.2 - Adds progress bar when downloading core zip files](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.2.2) - 2024-01-11

## What's Changed
* Adds a progress bar when installing a core by [@neil-morrison44](https://github.com/neil-morrison44) in [#224](https://github.com/neil-morrison44/pocket-sync/pull/224)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.2.1...v4.2.2

[Changes][v4.2.2]


<a id="v4.2.1"></a>
# [v4.2.1 - Fix grey screen error when files get deleted](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.2.1) - 2024-01-06

## What's Changed
* Fix error that can happen when files are deleted by [@neil-morrison44](https://github.com/neil-morrison44) in [#223](https://github.com/neil-morrison44/pocket-sync/pull/223)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.2.0...v4.2.1

[Changes][v4.2.1]


<a id="v4.2.0"></a>
# [v4.2.0 - Windows fixes, Display Modes, Big Sur fixes](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.2.0) - 2024-01-06

## What's Changed
* Fix .at polyfill to prevent blank screen by [@remy](https://github.com/remy) in [#217](https://github.com/neil-morrison44/pocket-sync/pull/217)
* Adds support for display modes & the core's info.txt by [@neil-morrison44](https://github.com/neil-morrison44) in [#218](https://github.com/neil-morrison44/pocket-sync/pull/218)
* Fix filesystem things on windows by [@neil-morrison44](https://github.com/neil-morrison44) in [#219](https://github.com/neil-morrison44/pocket-sync/pull/219)
* Improves the app's response to when only the content of a file changes by [@neil-morrison44](https://github.com/neil-morrison44) in [#221](https://github.com/neil-morrison44/pocket-sync/pull/221)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.1.0...v4.2.0

[Changes][v4.2.0]


<a id="v4.1.0"></a>
# [v4.1.0 - Palette creation / management, Big (potentially buggy) changes to the filesystem code](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.1.0) - 2023-12-30

## What's Changed
* Change all filesystem things to be notification / watch based by [@neil-morrison44](https://github.com/neil-morrison44) in [#209](https://github.com/neil-morrison44/pocket-sync/pull/209)
* Fixes the links in the release notes by [@neil-morrison44](https://github.com/neil-morrison44) in [#211](https://github.com/neil-morrison44/pocket-sync/pull/211)
* Windows filesystem fixes by [@neil-morrison44](https://github.com/neil-morrison44) in [#210](https://github.com/neil-morrison44/pocket-sync/pull/210)
* Add section for managing palettes by [@neil-morrison44](https://github.com/neil-morrison44) in [#212](https://github.com/neil-morrison44/pocket-sync/pull/212)
* A couple of filepath related fixes for windows by [@neil-morrison44](https://github.com/neil-morrison44) in [#213](https://github.com/neil-morrison44/pocket-sync/pull/213)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v4.0.0...v4.1.0

[Changes][v4.1.0]


<a id="v4.0.0"></a>
# [v4.0.0 - Update All, slight UI refresh, firmware v1.2 features](https://github.com/neil-morrison44/pocket-sync/releases/tag/v4.0.0) - 2023-12-10


<img width="1310" alt="update_all" src="https://github.com/neil-morrison44/pocket-sync/assets/2095051/06768c4c-829b-4a21-b977-855ffa9ec12f">


## What's Changed
* Updates things and fixes security warning by [@neil-morrison44](https://github.com/neil-morrison44) in [#196](https://github.com/neil-morrison44/pocket-sync/pull/196)
* Refresh the UI & implementation around controls by [@neil-morrison44](https://github.com/neil-morrison44) in [#198](https://github.com/neil-morrison44/pocket-sync/pull/198)
* Adds "Update All" feature by [@neil-morrison44](https://github.com/neil-morrison44) in [#200](https://github.com/neil-morrison44/pocket-sync/pull/200)
* Allows for unupscaled multi-screenshot export by [@neil-morrison44](https://github.com/neil-morrison44) in [#203](https://github.com/neil-morrison44/pocket-sync/pull/203)
* Adds support for v1.2 - a warning when the core needs it & the files get put in the right platform by [@neil-morrison44](https://github.com/neil-morrison44) in [#202](https://github.com/neil-morrison44/pocket-sync/pull/202)
* Bump version to v4 by [@neil-morrison44](https://github.com/neil-morrison44) in [#204](https://github.com/neil-morrison44/pocket-sync/pull/204)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.11.2...v4.0.0

[Changes][v4.0.0]


<a id="v3.11.2"></a>
# [v3.11.2 - Improved automatic performance scaling & other model bits](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.11.2) - 2023-12-04

## What's Changed
* Optimise the 3D model more by [@neil-morrison44](https://github.com/neil-morrison44) in [#195](https://github.com/neil-morrison44/pocket-sync/pull/195)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.11.1...v3.11.2

[Changes][v3.11.2]


<a id="v3.11.1"></a>
# [v3.11.1 - Automatic performance scaling for the 3D Pocket](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.11.1) - 2023-12-03

## What's Changed
* Adds automatic performance scaling on the 3D model by [@neil-morrison44](https://github.com/neil-morrison44) in [#194](https://github.com/neil-morrison44/pocket-sync/pull/194)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.11.0...v3.11.1

[Changes][v3.11.1]


<a id="v3.11.0"></a>
# [v3.11.0 - Classic colours, warning when jtbeta is out of date, 3D Pocket improvements](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.11.0) - 2023-12-01

## What's Changed
* Update polyfills.ts - add hasOwn by [@remy](https://github.com/remy) in [#185](https://github.com/neil-morrison44/pocket-sync/pull/185)
* Adds the new "classic" colours by [@neil-morrison44](https://github.com/neil-morrison44) in [#186](https://github.com/neil-morrison44/pocket-sync/pull/186)
* Compares the md5 when looking at root files by [@neil-morrison44](https://github.com/neil-morrison44) in [#188](https://github.com/neil-morrison44/pocket-sync/pull/188)
* Fixes the broken progress display by [@neil-morrison44](https://github.com/neil-morrison44) in [#189](https://github.com/neil-morrison44/pocket-sync/pull/189)
* 3D Pocket optimisations by [@neil-morrison44](https://github.com/neil-morrison44) in [#191](https://github.com/neil-morrison44/pocket-sync/pull/191)
* Limts the files which get md5'd while doing root file checks by [@neil-morrison44](https://github.com/neil-morrison44) in [#192](https://github.com/neil-morrison44/pocket-sync/pull/192)

## New Contributors
* [@remy](https://github.com/remy) made their first contribution in [#185](https://github.com/neil-morrison44/pocket-sync/pull/185)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.10.1...v3.11.0

[Changes][v3.11.0]


<a id="v3.10.1"></a>
# [v3.10.1 - Fixes issue with modals](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.10.1) - 2023-11-07

## What's Changed
* Bump tauri-apps/tauri-action from 0.4.4 to 0.4.5 by [@dependabot](https://github.com/dependabot) in [#177](https://github.com/neil-morrison44/pocket-sync/pull/177)
* Fixes the modal height issue caused by the modal width issue fix by [@neil-morrison44](https://github.com/neil-morrison44) in [#178](https://github.com/neil-morrison44/pocket-sync/pull/178)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.10.0...v3.10.1

[Changes][v3.10.1]


<a id="v3.10.0"></a>
# [v3.10.0 - Fast Downloads option added](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.10.0) - 2023-11-06

## What's Changed
* Adds "Fast Downloads" option to settings by [@neil-morrison44](https://github.com/neil-morrison44) in [#171](https://github.com/neil-morrison44/pocket-sync/pull/171)
* Fix modals on wide windows by [@neil-morrison44](https://github.com/neil-morrison44) in [#176](https://github.com/neil-morrison44/pocket-sync/pull/176)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.9.3...v3.10.0

[Changes][v3.10.0]


<a id="v3.9.3"></a>
# [v3.9.3](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.9.3) - 2023-11-01

## What's Changed
* Add better errors when installing cores by [@neil-morrison44](https://github.com/neil-morrison44) in [#169](https://github.com/neil-morrison44/pocket-sync/pull/169)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.9.2...v3.9.3

[Changes][v3.9.3]


<a id="v3.9.2"></a>
# [v3.9.2 - fix for when a file at root (e.g. jtbeta.zip) is changed](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.9.2) - 2023-10-31

## What's Changed
* Fix for when root files change by [@neil-morrison44](https://github.com/neil-morrison44) in [#168](https://github.com/neil-morrison44/pocket-sync/pull/168)
* Bump tauri-apps/tauri-action from 0.4.3 to 0.4.4 by [@dependabot](https://github.com/dependabot) in [#167](https://github.com/neil-morrison44/pocket-sync/pull/167)
* Bump actions/setup-node from 3 to 4 by [@dependabot](https://github.com/dependabot) in [#164](https://github.com/neil-morrison44/pocket-sync/pull/164)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.9.1...v3.9.2

[Changes][v3.9.2]


<a id="v3.9.1"></a>
# [v3.9.1 - Fixes file writing issue causing the app to not load](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.9.1) - 2023-10-17

## What's Changed
* Fix issue with un-truncated config files by [@neil-morrison44](https://github.com/neil-morrison44) in [#163](https://github.com/neil-morrison44/pocket-sync/pull/163)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.9.0...v3.9.1

[Changes][v3.9.1]


<a id="v3.9.0"></a>
# [v3.9.0 - New 3D Pocket, Faster Filesystem Fetch, MiSTer save mapping, Chinese Translation](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.9.0) - 2023-10-14

## What's Changed
* Fixes a couple of issues with the Zip Install by [@neil-morrison44](https://github.com/neil-morrison44) in [#151](https://github.com/neil-morrison44/pocket-sync/pull/151)
* Updates to Tauri 1.5 by [@neil-morrison44](https://github.com/neil-morrison44) in [#152](https://github.com/neil-morrison44/pocket-sync/pull/152)
* Improve the 3D pocket, add support for transparent models & mix and matching body / buttons by [@neil-morrison44](https://github.com/neil-morrison44) in [#155](https://github.com/neil-morrison44/pocket-sync/pull/155)
* Hide the non-main platform in the "Games" screen & filter out `.sav`s in required files by [@neil-morrison44](https://github.com/neil-morrison44) in [#156](https://github.com/neil-morrison44/pocket-sync/pull/156)
* Much faster fetching, uses modified time instead of crc32 by [@neil-morrison44](https://github.com/neil-morrison44) in [#157](https://github.com/neil-morrison44/pocket-sync/pull/157)
* Allow for user-defined save mapping between the Pocket & the MiSTer by [@neil-morrison44](https://github.com/neil-morrison44) in [#158](https://github.com/neil-morrison44/pocket-sync/pull/158)
* Create zh-CN by [@fevaoctwh](https://github.com/fevaoctwh) in [#154](https://github.com/neil-morrison44/pocket-sync/pull/154)
* Moves some i18n bits around & makes it clearer when there's no required files yet by [@neil-morrison44](https://github.com/neil-morrison44) in [#159](https://github.com/neil-morrison44/pocket-sync/pull/159)

## New Contributors
* [@fevaoctwh](https://github.com/fevaoctwh) made their first contribution in [#154](https://github.com/neil-morrison44/pocket-sync/pull/154)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.8.1...v3.9.0

[Changes][v3.9.0]


<a id="v3.8.1"></a>
# [v3.8.1 - Improves the UI around not installed cores](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.8.1) - 2023-09-19

## What's Changed
* Uses all the new stuff in the inventory to make uninstalled cores interesting by [@neil-morrison44](https://github.com/neil-morrison44) in [#147](https://github.com/neil-morrison44/pocket-sync/pull/147)
* Bump tauri-apps/tauri-action from 0.4.2 to 0.4.3 by [@dependabot](https://github.com/dependabot) in [#128](https://github.com/neil-morrison44/pocket-sync/pull/128)
* Bump actions/checkout from 3 to 4 by [@dependabot](https://github.com/dependabot) in [#138](https://github.com/neil-morrison44/pocket-sync/pull/138)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.8.0...v3.8.1

---

## Quick links:
- Mac: [Pocket.Sync_3.8.1_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.8.1/Pocket.Sync_3.8.1_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_3.8.1_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.8.1/pocket-sync_3.8.1_amd64.AppImage) [pocket-sync_3.8.1_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.8.1/pocket-sync_3.8.1_amd64.deb)
- Windows: [Pocket.Sync_3.8.1_x64_en-US.msi](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.8.1/Pocket.Sync_3.8.1_x64_en-US.msi)

[Changes][v3.8.1]


<a id="v3.8.0"></a>
# [v3.8.0 - Flag cores that require a license & minor QOL tweaks](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.8.0) - 2023-09-18

## What's Changed
* Adds support for the `requires_license` property from the inventory by [@neil-morrison44](https://github.com/neil-morrison44) in [#145](https://github.com/neil-morrison44/pocket-sync/pull/145)
* Allows toggling the alternative files from the required files modal itself by [@neil-morrison44](https://github.com/neil-morrison44) in [#146](https://github.com/neil-morrison44/pocket-sync/pull/146)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.7.3...v3.8.0

---

## Quick links:
- Mac: [Pocket.Sync_3.8.0_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.8.0/Pocket.Sync_3.8.0_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_3.8.0_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.8.0/pocket-sync_3.8.0_amd64.AppImage) [pocket-sync_3.8.0_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.8.0/pocket-sync_3.8.0_amd64.deb)
- Windows: [Pocket.Sync_3.8.0_x64_en-US.msi](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.8.0/Pocket.Sync_3.8.0_x64_en-US.msi)

[Changes][v3.8.0]


<a id="v3.7.3"></a>
# [v3.7.3 - Handles unparsable data packs](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.7.3) - 2023-09-12

## What's Changed
* Handles unparsable data packs by [@neil-morrison44](https://github.com/neil-morrison44) in [#144](https://github.com/neil-morrison44/pocket-sync/pull/144)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.7.2...v3.7.3

## Quick links:
- Mac: [Pocket.Sync_3.7.3_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.7.3/Pocket.Sync_3.7.3_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_3.7.3_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.7.3/pocket-sync_3.7.3_amd64.AppImage) [pocket-sync_3.7.3_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.7.3/pocket-sync_3.7.3_amd64.deb)
- Windows: [Pocket.Sync_3.7.3_x64_en-US.msi](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.7.3/Pocket.Sync_3.7.3_x64_en-US.msi)

[Changes][v3.7.3]


<a id="v3.7.2"></a>
# [v3.7.2 - Fixes hidden files issue](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.7.2) - 2023-09-06

## What's Changed
* Ignores hidden files when scanning for root files by [@neil-morrison44](https://github.com/neil-morrison44) in [#141](https://github.com/neil-morrison44/pocket-sync/pull/141)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.7.1...v3.7.2

[Changes][v3.7.2]


<a id="v3.7.1"></a>
# [v3.7.1 - Fixes the "required files" for the new JTbeta cores](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.7.1) - 2023-09-05

## What's Changed
* Fixes the "required files" for the new JT cores by [@neil-morrison44](https://github.com/neil-morrison44) in [#140](https://github.com/neil-morrison44/pocket-sync/pull/140)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.7.0...v3.7.1

[Changes][v3.7.1]


<a id="v3.7.0"></a>
# [v3.7.0 - Game Boy Camera Export](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.7.0) - 2023-09-04

## What's Changed
* Adds GB Camera export by [@neil-morrison44](https://github.com/neil-morrison44) in [#136](https://github.com/neil-morrison44/pocket-sync/pull/136)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.6.0...v3.7.0

## Quick links:
- Mac: [Pocket.Sync_3.7.0_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.7.0/Pocket.Sync_3.7.0_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_3.7.0_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.7.0/pocket-sync_3.7.0_amd64.AppImage) [pocket-sync_3.7.0_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.7.0/pocket-sync_3.7.0_amd64.deb)
- Windows: [Pocket.Sync_3.7.0_x64_en-US.msi](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.7.0/Pocket.Sync_3.7.0_x64_en-US.msi)

[Changes][v3.7.0]


<a id="v3.6.0"></a>
# [v3.6.0 - Glow, Spanish Translation, JTBETA, Replacement Cores](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.6.0) - 2023-09-03

## What's Changed
* Adds the ability for a core to replace a "previous" core by [@neil-morrison44](https://github.com/neil-morrison44) in [#129](https://github.com/neil-morrison44/pocket-sync/pull/129)
* Tidy up the zip install part a little by [@neil-morrison44](https://github.com/neil-morrison44) in [#130](https://github.com/neil-morrison44/pocket-sync/pull/130)
* add Spanish translation by [@rayelward](https://github.com/rayelward) in [#133](https://github.com/neil-morrison44/pocket-sync/pull/133)
* Adds (tentative) support for `replaced_by` & `replaces` from the inventory by [@neil-morrison44](https://github.com/neil-morrison44) in [#131](https://github.com/neil-morrison44/pocket-sync/pull/131)
* Adds "glow" to the options for Pocket colour by [@neil-morrison44](https://github.com/neil-morrison44) in [#134](https://github.com/neil-morrison44/pocket-sync/pull/134)
* Adds handling for the JTBETA file etc by [@neil-morrison44](https://github.com/neil-morrison44) in [#135](https://github.com/neil-morrison44/pocket-sync/pull/135)

## New Contributors
* [@rayelward](https://github.com/rayelward) made their first contribution in [#133](https://github.com/neil-morrison44/pocket-sync/pull/133)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.5.3...v3.6.0

## Quick links:
- Mac: [Pocket.Sync_3.6.0_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.6.0/Pocket.Sync_3.6.0_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_3.6.0_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.6.0/pocket-sync_3.6.0_amd64.AppImage) [pocket-sync_3.6.0_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.6.0/pocket-sync_3.6.0_amd64.deb)
- Windows: [Pocket.Sync_3.6.0_x64_en-US.msi](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.6.0/Pocket.Sync_3.6.0_x64_en-US.msi)

[Changes][v3.6.0]


<a id="v3.5.3"></a>
# [v3.5.3 - Fixes an issue with folder paths in the fetch feature](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.5.3) - 2023-07-13

## What's Changed
* Fixes issue when the folder on the Pocket has a leading slash by [@neil-morrison44](https://github.com/neil-morrison44) in [#127](https://github.com/neil-morrison44/pocket-sync/pull/127)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.5.2...v3.5.3

[Changes][v3.5.3]


<a id="v3.5.2"></a>
# [v3.5.2 - Improves file caching error handling](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.5.2) - 2023-07-11

## What's Changed
* Finally sets up eslint by [@neil-morrison44](https://github.com/neil-morrison44) in [#124](https://github.com/neil-morrison44/pocket-sync/pull/124)
* Fix linux file caching error by [@neil-morrison44](https://github.com/neil-morrison44) in [#126](https://github.com/neil-morrison44/pocket-sync/pull/126)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.5.1...v3.5.2

[Changes][v3.5.2]


<a id="v3.5.1"></a>
# [v3.5.1 - Fetch & Big Sur fixes](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.5.1) - 2023-07-09

## What's Changed
* Fetch Folder Fix & .at Polyfill by [@neil-morrison44](https://github.com/neil-morrison44) in [#123](https://github.com/neil-morrison44/pocket-sync/pull/123)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.5.0...v3.5.1

## Quick links:
- Mac: [Pocket.Sync_3.5.1_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.5.1/Pocket.Sync_3.5.1_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_3.5.1_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.5.1/pocket-sync_3.5.1_amd64.AppImage) [pocket-sync_3.5.1_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.5.1/pocket-sync_3.5.1_amd64.deb)
- Windows: [Pocket.Sync_3.5.1_x64-setup.exe](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.5.1/Pocket.Sync_3.5.1_x64-setup.exe)

[Changes][v3.5.1]


<a id="v3.5.0"></a>
# [v3.5.0 - Adds Fetch feature, for moving your files to the Pocket](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.5.0) - 2023-07-08

## What's Changed
* Adds new "Fetch" feature for pulling files onto the Pocket SD card by [@neil-morrison44](https://github.com/neil-morrison44) in [#117](https://github.com/neil-morrison44/pocket-sync/pull/117)
* Disconnect fix & more by [@neil-morrison44](https://github.com/neil-morrison44) in [#118](https://github.com/neil-morrison44/pocket-sync/pull/118)
* Switches to use the `GamePocket` font by [@neil-morrison44](https://github.com/neil-morrison44) in [#119](https://github.com/neil-morrison44/pocket-sync/pull/119)
* Allow selection / deselection of whole directories during zip install by [@neil-morrison44](https://github.com/neil-morrison44) in [#120](https://github.com/neil-morrison44/pocket-sync/pull/120)

<img width="1090" alt="Screenshot 2023-07-08 at 22 49 04" src="https://github.com/neil-morrison44/pocket-sync/assets/2095051/5aecdc63-b94f-47e6-9eeb-28e489d90b8a">




**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.4.0...v3.5.0

## Quick links:
- Mac: [Pocket.Sync_3.5.0_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.5.0/Pocket.Sync_3.5.0_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_3.5.0_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.5.0/pocket-sync_3.5.0_amd64.AppImage) [pocket-sync_3.5.0_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.5.0/pocket-sync_3.5.0_amd64.deb)
- Windows: [Pocket.Sync_3.5.0_x64-setup.exe](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.5.0/Pocket.Sync_3.5.0_x64-setup.exe)

[Changes][v3.5.0]


<a id="v3.4.0"></a>
# [v3.4.0 - Adds support for changing platform.jsons using packs](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.4.0) - 2023-07-05

## What's Changed
* Allow changing platform JSONs from "data packs" by [@neil-morrison44](https://github.com/neil-morrison44) in [#115](https://github.com/neil-morrison44/pocket-sync/pull/115)
* Bump actions/setup-node from 1 to 3 by [@dependabot](https://github.com/dependabot) in [#108](https://github.com/neil-morrison44/pocket-sync/pull/108)

<img width="1407" alt="Screenshot 2023-07-05 at 23 06 56" src="https://github.com/neil-morrison44/pocket-sync/assets/2095051/38423dd9-3d40-46a6-9384-2435b3a5388b">

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.3.1...v3.4.0

## Quick links:
- Mac: [Pocket.Sync_3.4.0_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.4.0/Pocket.Sync_3.4.0_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_3.4.0_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.4.0/pocket-sync_3.4.0_amd64.AppImage) [pocket-sync_3.4.0_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.4.0/pocket-sync_3.4.0_amd64.deb)
- Windows: [Pocket.Sync_3.4.0_x64-setup.exe](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.4.0/Pocket.Sync_3.4.0_x64-setup.exe)

[Changes][v3.4.0]


<a id="v3.3.0"></a>
# [v3.3.0 - File Caching (USB should be more usable now), support for translations, general improvements](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.3.0) - 2023-07-02

## Info
* From now on any "big" (> 100 bytes) files will be cached on your computer so they'll only need read from the Pocket once, unless they change. So if you mainly use USB for the Pocket I recommend giving the app a go again, for the best experience plug in SD card once and navigate around a bit to fill out the cache with all the core images / screenshots etc
* The app now supports being translated into different languages, check [the Translations section in the readme](https://github.com/neil-morrison44/pocket-sync#translations) to see how to help out if you want to to translate it into something
* Bunch of under-the-hood things to speed the app up a bit & make it more reliable
* Update to the latest Tarui which I believe has a different windows installer & should generate the files for auto-updating universal mac builds without me having to do a manual step...

## What's Changed
* Bump actions/checkout from 2 to 3 by [@dependabot](https://github.com/dependabot) in [#106](https://github.com/neil-morrison44/pocket-sync/pull/106)
* Adds aggressive on-computer file caching to (hopefully) improve the USB experience by [@neil-morrison44](https://github.com/neil-morrison44) in [#109](https://github.com/neil-morrison44/pocket-sync/pull/109)
* Update Tauri & make more things async by [@neil-morrison44](https://github.com/neil-morrison44) in [#110](https://github.com/neil-morrison44/pocket-sync/pull/110)
* Adds static screen effect when changing loading screenshots by [@neil-morrison44](https://github.com/neil-morrison44) in [#111](https://github.com/neil-morrison44/pocket-sync/pull/111)
* Almost everything is now translatable by [@neil-morrison44](https://github.com/neil-morrison44) in [#112](https://github.com/neil-morrison44/pocket-sync/pull/112)
* Slightly update the icon by [@neil-morrison44](https://github.com/neil-morrison44) in [#113](https://github.com/neil-morrison44/pocket-sync/pull/113)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.2.1...v3.3.0

## Quick links:
- Mac: [Pocket.Sync_3.3.0_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.3.0/Pocket.Sync_3.3.0_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_3.3.0_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.3.0/pocket-sync_3.3.0_amd64.AppImage) [pocket-sync_3.3.0_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.3.0/pocket-sync_3.3.0_amd64.deb)
- Windows: [Pocket.Sync_3.3.0_x64-setup.exe](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.3.0/Pocket.Sync_3.3.0_x64-setup.exe)

[Changes][v3.3.0]


<a id="v3.2.1"></a>
# [v3.2.1 - Uses official JSON endpoints for firmware & shows firmware updates on first screen](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.2.1) - 2023-06-06

## What's Changed
* Use official Analogue JSON endpoints for firmware by [@neil-morrison44](https://github.com/neil-morrison44) in [#105](https://github.com/neil-morrison44/pocket-sync/pull/105)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.2.0...v3.2.1


Quick links:
- Mac: [Pocket.Sync_3.2.1_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.2.1/Pocket.Sync_3.2.1_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_3.2.1_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.2.1/pocket-sync_3.2.1_amd64.AppImage) [pocket-sync_3.2.1_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.2.1/pocket-sync_3.2.1_amd64.deb)
- Windows: [Pocket.Sync_3.2.1_x64_en-US.msi](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.2.1/Pocket.Sync_3.2.1_x64_en-US.msi)

[Changes][v3.2.1]


<a id="v3.2.0"></a>
# [v3.2.0 - Adds firmware tab, including release notes & previous versions](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.2.0) - 2023-05-06

## What's Changed
* Adds support for changing the firmware in new `Firmware` tab by [@neil-morrison44](https://github.com/neil-morrison44) in [#103](https://github.com/neil-morrison44/pocket-sync/pull/103)
* Also uses Analogue's md5 hash to verify downloaded firmware & re-attempts the download a couple of times if it fails to make it more robust (shouldn't matter in 99% of cases though)
* Worth noting that if Analogue change pretty much _anything_ about their Firmware page the app'll break, but only the `Firmware` bit'll break & it won't break in a way that could mess anything up

<img width="1266" alt="Screenshot 2023-05-06 at 00 06 45" src="https://user-images.githubusercontent.com/2095051/236587130-a1ab435f-f55b-4092-8cf3-b3cf8a42c20a.png">
<img width="1266" alt="Screenshot 2023-05-06 at 00 06 42" src="https://user-images.githubusercontent.com/2095051/236587137-502375b7-ae3e-4d79-bb7a-035c3625bdce.png">

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.1.0...v3.2.0

Quick links:
- Mac: [Pocket.Sync_3.2.0_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.2.0/Pocket.Sync_3.2.0_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_3.2.0_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.2.0/pocket-sync_3.2.0_amd64.AppImage) [pocket-sync_3.2.0_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.2.0/pocket-sync_3.2.0_amd64.deb)
- Windows: [Pocket.Sync_3.2.0_x64_en-US.msi](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.2.0/Pocket.Sync_3.2.0_x64_en-US.msi)

[Changes][v3.2.0]


<a id="v3.1.0"></a>
# [v3.1.0 - Handles files moving during core updates & adds a "auto-reconnect" option in settings](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.1.0) - 2023-04-27

## What's Changed
* De-dupes files during zip installs by [@neil-morrison44](https://github.com/neil-morrison44) in [#101](https://github.com/neil-morrison44/pocket-sync/pull/101)
* Adds auto-reconnect option to settings by [@neil-morrison44](https://github.com/neil-morrison44) in [#102](https://github.com/neil-morrison44/pocket-sync/pull/102)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.0.1...v3.1.0

Quick links:
- Mac: [Pocket.Sync_3.1.0_universal.dmg](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.1.0/Pocket.Sync_3.1.0_universal.dmg)
- Linux (also available via Flatpak): [pocket-sync_3.1.0_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.1.0/pocket-sync_3.1.0_amd64.AppImage) [pocket-sync_3.1.0_amd64.deb](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.1.0/pocket-sync_3.1.0_amd64.deb)
- Windows: [Pocket.Sync_3.1.0_x64_en-US.msi](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.1.0/Pocket.Sync_3.1.0_x64_en-US.msi)

[Changes][v3.1.0]


<a id="v3.0.1"></a>
# [v3.0.1 - PCECD MiSTer save sync fix & misc speedups](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.0.1) - 2023-04-13

## What's Changed
* Fix PCECD MiSTer save lookup by [@neil-morrison44](https://github.com/neil-morrison44) in [#97](https://github.com/neil-morrison44/pocket-sync/pull/97)
* Switch to using CRC32 for most hashing things by [@neil-morrison44](https://github.com/neil-morrison44) in [#98](https://github.com/neil-morrison44/pocket-sync/pull/98)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v3.0.0...v3.0.1

---

Quick links:
- Mac: [Pocket.Sync_universal.app.tar.gz](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.0.1/Pocket.Sync_universal.app.tar.gz)
- Linux (also available via Flatpak): [pocket-sync_3.0.1_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.0.0/pocket-sync_3.0.1_amd64.AppImage)
- Windows: [Pocket.Sync_3.0.1_x64_en-US.msi](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.0.0/Pocket.Sync_3.0.1_x64_en-US.msi)

[Changes][v3.0.1]


<a id="v3.0.0"></a>
# [v3.0.0 - MiSTer save sync](https://github.com/neil-morrison44/pocket-sync/releases/tag/v3.0.0) - 2023-04-04

## What's Changed
* Adds mister save sync back by [@neil-morrison44](https://github.com/neil-morrison44) in [#94](https://github.com/neil-morrison44/pocket-sync/pull/94)

* Adds a new button to the "Saves" section which enables you to connect to a MiSTer over FTP & transfer saves back and forth, telling you which one's newer / if they're already equal etc

<img width="1242" alt="Screenshot 2023-04-03 at 00 33 35" src="https://user-images.githubusercontent.com/2095051/229876132-af7d1cb4-1179-4dba-ae9e-439589d323f8.png">

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.9.0...v3.0.0


---

Quick links:
- Mac: [Pocket.Sync_universal.app.tar.gz](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.0.0/Pocket.Sync_universal.app.tar.gz)
- Linux (also available via Flatpak): [pocket-sync_3.0.0_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.0.0/pocket-sync_3.0.0_amd64.AppImage)
- Windows: [Pocket.Sync_3.0.0_x64_en-US.msi](https://github.com/neil-morrison44/pocket-sync/releases/download/v3.0.0/Pocket.Sync_3.0.0_x64_en-US.msi)

[Changes][v3.0.0]


<a id="v2.9.0"></a>
# [v2.9.0 - skips `_alternatives` & some fixes for things that get polled](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.9.0) - 2023-03-26

## What's Changed
* Show when the newsfeed was last refreshed by [@neil-morrison44](https://github.com/neil-morrison44) in [#90](https://github.com/neil-morrison44/pocket-sync/pull/90)
* Improved inventory updating by [@neil-morrison44](https://github.com/neil-morrison44) in [#91](https://github.com/neil-morrison44/pocket-sync/pull/91)
* Add option to skip files under `_alternatives` folder by [@neil-morrison44](https://github.com/neil-morrison44) in [#92](https://github.com/neil-morrison44/pocket-sync/pull/92)
* Switch to using an `Arc` instead of the `_b` `_c` things. Not _much_ nicer really but more rusty. by [@neil-morrison44](https://github.com/neil-morrison44) in [#93](https://github.com/neil-morrison44/pocket-sync/pull/93)

(I'm working on adding back MiSTer save syncing, but it's going to take a while)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.8.1...v2.9.0

---
Quick links:
- Mac: [Pocket.Sync_universal.app.tar.gz](https://github.com/neil-morrison44/pocket-sync/releases/download/v2.9.0/Pocket.Sync_universal.app.tar.gz)
- Linux (also available via Flatpak): [pocket-sync_2.9.0_amd64.AppImage](https://github.com/neil-morrison44/pocket-sync/releases/download/v2.9.0/pocket-sync_2.9.0_amd64.AppImage)
- Windows: [Pocket.Sync_2.9.0_x64_en-US.msi](https://github.com/neil-morrison44/pocket-sync/releases/download/v2.9.0/Pocket.Sync_2.9.0_x64_en-US.msi)

[Changes][v2.9.0]


<a id="v2.8.1"></a>
# [v2.8.1 - A little speedup & prettier Pocket](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.8.1) - 2023-03-13

## What's Changed
* Improve 3D pocket lighting & reflections by [@neil-morrison44](https://github.com/neil-morrison44) in [#85](https://github.com/neil-morrison44/pocket-sync/pull/85)
* Fixes the core page reload every ~10 mins by [@neil-morrison44](https://github.com/neil-morrison44) in [#86](https://github.com/neil-morrison44/pocket-sync/pull/86)
* Updates some npm packages & adds some more interactivity to the 3D Pocket by [@neil-morrison44](https://github.com/neil-morrison44) in [#87](https://github.com/neil-morrison44/pocket-sync/pull/87)
* Switch to `tokio::fs` methods for a little bit of a speedup by [@neil-morrison44](https://github.com/neil-morrison44) in [#88](https://github.com/neil-morrison44/pocket-sync/pull/88)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.8.0...v2.8.1

---

Github takes ~25 mins to build & attach the downloads below

[Changes][v2.8.1]


<a id="v2.8.0"></a>
# [v2.8.0 -Adds the News Feed](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.8.0) - 2023-02-27

## What's Changed
* Add the "news feed" from the inventory by [@neil-morrison44](https://github.com/neil-morrison44) in [#82](https://github.com/neil-morrison44/pocket-sync/pull/82)

<img width="1392" alt="Screenshot 2023-02-27 at 00 03 18" src="https://user-images.githubusercontent.com/2095051/221448862-050d6015-2387-403a-8f26-960d365fc492.png">


* I'd have waited a little while & got more features in (like showing which news feed items have come in since you last connected) but I noticed there's a bug when the inventory auto-refreshes and thought I'd fix it at the same time...
* The "Thanks" section's been relocated to the bottom of the Settings page to make way for the News bit on the "About" screen
* The News items on the unconnected screen aren't clickable, but those on the "About" screen will take you directly to the installed / uninstalled core

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.7.0...v2.8.0

---
Github takes ~20 mins to build & attach the downloads below

[Changes][v2.8.0]


<a id="v2.7.0"></a>
# [v2.7.0 - V2 Inventory API (JOTEGO & pram0d cores)](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.7.0) - 2023-02-23

## What's Changed
* Prevent faux style application to Analogue font by [@AbFarid](https://github.com/AbFarid) in [#80](https://github.com/neil-morrison44/pocket-sync/pull/80)
* Switches to V2 of the inventory API by [@neil-morrison44](https://github.com/neil-morrison44) in [#81](https://github.com/neil-morrison44/pocket-sync/pull/81)

* Now uses the v2 of the inventory API, meaning JOTEGO & pram0d cores (+ any future non-github release cores) are now listed, big thanks to [@joshcampbell191](https://github.com/joshcampbell191) for getting that out
* Plus a (potential) fix to a blurry font issue by [@AbFarid](https://github.com/AbFarid), looks better to me
<img width="422" alt="Screenshot 2023-02-23 at 22 55 20" src="https://user-images.githubusercontent.com/2095051/221049308-df28f70e-b376-4f22-8db8-a7387edbf76a.png">

## New Contributors
* [@AbFarid](https://github.com/AbFarid) made their first contribution in [#80](https://github.com/neil-morrison44/pocket-sync/pull/80)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.6.3...v2.7.0

---

Github takes ~20 mins to build & attach the downloads below

[Changes][v2.7.0]


<a id="v2.6.3"></a>
# [v2.6.3 - Fix Image Asset Packs on MacOS 11](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.6.3) - 2023-02-21

## What's Changed
* Fix MacOS 11 image pack issue by [@neil-morrison44](https://github.com/neil-morrison44) in [#79](https://github.com/neil-morrison44/pocket-sync/pull/79)
* Nothing Else in this one, so feel free to skip if you're unaffected

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.6.2...v2.6.3

---

Github takes ~20 mins to build & attach the releases below

[Changes][v2.6.3]


<a id="v2.6.2"></a>
# [v2.6.2 - JTCPS2 tweaks](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.6.2) - 2023-02-20

## What's Changed
* Improve required files loading experience by [@neil-morrison44](https://github.com/neil-morrison44) in [#78](https://github.com/neil-morrison44/pocket-sync/pull/78)

* Generally handles big cores with _lots_ of big required files (like the CPS2) better with the UI being more informative & responsive

<img width="1419" alt="Screenshot 2023-02-20 at 01 20 54" src="https://user-images.githubusercontent.com/2095051/219988541-1aac7fc4-8b5e-4e07-bb5d-10de39c7d99d.png">

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.6.1...v2.6.2

---

Github takes ~20 mins to build and attach the files below

[Changes][v2.6.2]


<a id="v2.6.1"></a>
# [v2.6.1 - Fixes Image Pack loading issue](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.6.1) - 2023-02-14

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.6.0...v2.6.1

- Fix for the image pack loading issue



---
Github takes ~20 mins to build & attach the downloads below

[Changes][v2.6.1]


<a id="v2.6.0"></a>
# [v2.6.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.6.0) - 2023-02-10

## What's Changed
* Improved JSON errors & support for `alternate_filenames` by [@neil-morrison44](https://github.com/neil-morrison44) in [#77](https://github.com/neil-morrison44/pocket-sync/pull/77)

- JSON related errors now output the filename & a _much_ better error saying what went wrong
- Adds support for `alternate_filenames` in core's data.json (for automatically loading alternate bioses etc)
- Correctly sets the minimum MacOS version to 11, since 10.15 isn't loading anymore
- Instance JSON building now keeps the input file's folder structure & fix for nested folders on windows


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.5.0...v2.6.0

---

Github takes ~20 mins to build & attach the downloads, so if you're here early wait a bit

[Changes][v2.6.0]


<a id="v2.5.0"></a>
# [v2.5.0 - Working selfupdater & instance JSON builder](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.5.0) - 2023-02-06

## What's Changed
* Much improved instance.json builder by [@neil-morrison44](https://github.com/neil-morrison44) in [#75](https://github.com/neil-morrison44/pocket-sync/pull/75)


<img width="1419" alt="Screenshot 2023-02-06 at 21 24 02" src="https://user-images.githubusercontent.com/2095051/217096215-19b8c5ff-3b4e-4ead-b619-253628796c0f.png">

- Accessed from the `Instance JSON` button within the `Games` section
- Now cores can be distributed with an `instance-packager.json` file which tells updaters (etc) how to find the files needed by the core & package them into `instance.json` files
- There's a standalone binary available on https://github.com/neil-morrison44/openfpga-instance-packager & a readme with the file's specification ( a collaborative effort between myself, [@mattpannella](https://github.com/mattpannella), & [@Mazamars312](https://github.com/Mazamars312) )
- The format's probably _very_ useful for future consoles - e.g. the NeoGeo core, for example, wouldn't need to be distributed with all the json files regardless of if the user has those games installed anymore.
- Less useful for Arcade cores though since the expectation is the user won't have the arcade files already & the instance json files are what tells the updaters which files to look for

- Also the App's self update should work across all platforms now so you might not even be reading this 



**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.4.0...v2.5.0

---

Github takes ~20 mins to build & attach the downloads below, so if you're here early just wait a bit

[Changes][v2.5.0]


<a id="v2.4.0"></a>
# [v2.4.0 - autoupdater & interact.json builder](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.4.0) - 2023-01-31

## What's Changed
* Enables Tauri autoupdater & adds button to create instance JSON files by [@neil-morrison44](https://github.com/neil-morrison44) in [#73](https://github.com/neil-morrison44/pocket-sync/pull/73)

* Adds a new button in the "Games" view `Interact JSON` which'll build json files for systems which need them (e.g. the upcoming TurboGrafx-16 CD core), it's not perfect yet though so expect some revisions & hopefully support for more systems as CD cores get released

* ~~Also enables an autoupdater so, hopefully, this'll be the last time anyone has to manually download & update the app. I've left in the current behaviour too since I'll only see if it works once this is out. 🤞🏻~~ looks like the autoupdater only works for whichever is the 1st platform to build on Github, so only the linux appImage for now.


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.3.0...v2.4.0

---

Github takes ~20 minutes to build and attach the downloads below, so if they're not there yet they should be soon

[Changes][v2.4.0]


<a id="v2.3.0"></a>
# [v2.3.0 - Platform Image Pack Support](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.3.0) - 2023-01-28

## What's Changed
* Adds previous & next buttons to the screenshot info view by [@neil-morrison44](https://github.com/neil-morrison44) in [#65](https://github.com/neil-morrison44/pocket-sync/pull/65)
* Show game extensions by [@neil-morrison44](https://github.com/neil-morrison44) in [#66](https://github.com/neil-morrison44/pocket-sync/pull/66)
* Adds support for changing platform images from the image packs by [@neil-morrison44](https://github.com/neil-morrison44) in [#69](https://github.com/neil-morrison44/pocket-sync/pull/69)

<img width="1419" alt="Screenshot 2023-01-28 at 00 54 32" src="https://user-images.githubusercontent.com/2095051/215234698-5a976895-ea4b-4107-a1c1-32a51b91de97.png">

- Fetches [@mattpannella](https://github.com/mattpannella)'s json from https://github.com/mattpannella/pocket-updater-utility/blob/main/image_packs.json (ideally this gets moved somewhere inventory adjacent at some point)

<img width="1419" alt="Screenshot 2023-01-28 at 01 36 08" src="https://user-images.githubusercontent.com/2095051/215234819-72e5f1a1-6ca2-43e9-b242-058c3bce3552.png">

- The games view now lists the supported extensions (it might list the bios extensions too sometimes)

<img width="1258" alt="Screenshot 2023-01-23 at 22 57 38" src="https://user-images.githubusercontent.com/2095051/214171339-b345239c-6fb7-4594-8084-3abd852b9c0d.png">

- Screenshots now have previous & next buttons so you can go back and forward quickly, also supports the arrow keys

- Some other really minor QOL tweaks


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.2.1...v2.3.0

---

It takes GitHub ~15 mins to build & attach the downloads below, so if they're not there yet they should be soon

[Changes][v2.3.0]


<a id="v2.2.1"></a>
# [v2.2.1 - NEOGEO core fixes](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.2.1) - 2023-01-14

## What's Changed
* Fix NeoGeo core taking ages to show by [@neil-morrison44](https://github.com/neil-morrison44) in [#61](https://github.com/neil-morrison44/pocket-sync/pull/61)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.2.0...v2.2.1

--- 

Github takes ~15 minutes to attach the downloads below

[Changes][v2.2.1]


<a id="v2.2.0"></a>
# [v2.2.0 - game specific inputs & settings + universal MacOS build](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.2.0) - 2023-01-12

## What's Changed
* Adds support for showing individual preset JSONs by [@neil-morrison44](https://github.com/neil-morrison44) in [#57](https://github.com/neil-morrison44/pocket-sync/pull/57)
* Add support for macOS ARM64 builds by [@dstaley](https://github.com/dstaley) in [#54](https://github.com/neil-morrison44/pocket-sync/pull/54)
* Allows for changing the individual interact menus for json files by [@neil-morrison44](https://github.com/neil-morrison44) in [#58](https://github.com/neil-morrison44/pocket-sync/pull/58)

<img width="1258" alt="Screenshot 2023-01-11 at 19 11 43" src="https://user-images.githubusercontent.com/2095051/211943283-1771c9bd-03f5-429b-a6b8-80b53095a4e5.png">
<img width="1258" alt="Screenshot 2023-01-11 at 23 57 26" src="https://user-images.githubusercontent.com/2095051/211943403-37e95811-7b85-4ac1-b484-d807a2ec1876.png">

* Particularly useful for CPS1 games


## New Contributors
* [@dstaley](https://github.com/dstaley) made their first contribution in [#54](https://github.com/neil-morrison44/pocket-sync/pull/54)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.1.0...v2.2.0

---

Github'll take ~15 minutes to build & attach the files below

[Changes][v2.2.0]


<a id="v2.1.0"></a>
# [v2.1.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.1.0) - 2023-01-09

## What's Changed
* Adds multi-screenshot export & delete by [@neil-morrison44](https://github.com/neil-morrison44) in [#49](https://github.com/neil-morrison44/pocket-sync/pull/49)
* Improved "Required Files" experience by [@neil-morrison44](https://github.com/neil-morrison44) in [#52](https://github.com/neil-morrison44/pocket-sync/pull/52)
* Automatically backup saves on connection by [@neil-morrison44](https://github.com/neil-morrison44) in [#53](https://github.com/neil-morrison44/pocket-sync/pull/53)
* Fixes the pixels at the edges of platform images by [@neil-morrison44](https://github.com/neil-morrison44) in [#55](https://github.com/neil-morrison44/pocket-sync/pull/55)

- Can now export / delete multiple upscaled & aspect ratio corrected screenshots at once
- The `required files` section is improved, it'll now show when something's been updated in the archive & better show what's missing from the archive & not bother downloading things twice
- Save backups now happen automatically on connection, assuming you've defined at least one backup location & there's been any changed saves since the last time Pocket Sync was run
- Fixes an issue where the edges of platform art were being clipped off in the image editing UI & elsewhere


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.0.1...v2.1.0

---

Github'll take ~14 minutes to add the downloads below

[Changes][v2.1.0]


<a id="v2.0.1"></a>
# [v2.0.1](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.0.1) - 2023-01-04

## What's Changed
* Fixes issue showing slapfight core by [@neil-morrison44](https://github.com/neil-morrison44) in [#47](https://github.com/neil-morrison44/pocket-sync/pull/47)

- The slapfight core (and any future cores without author icons) will now load successfully


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v2.0.0...v2.0.1

---

it'll take github ~14 minutes to build and attach the downloads below

[Changes][v2.0.1]


<a id="v2.0.0"></a>
# [v2.0.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v2.0.0) - 2022-12-24

## v2.0.0

Quite a few things in this release:
* The inventory API's been updated, there's nothing visual with this change but Pocket Sync versions before 2.0.0 will stop working in a month or so
* It no longer does the annoying reloading thing every 15 minutes when it updates the inventory list
* Adds a `Settings` button to each core which opens up a way of viewing / setting the `Core Settings` (I've tested this with a few cores and all seems fine, but changing things in the `Settings` folder is new for the app so you might want to manually back up that folder just incase)
<img width="992" alt="Screenshot 2022-12-24 at 02 21 40" src="https://user-images.githubusercontent.com/2095051/209420099-d643f8b5-5666-4f48-8a6e-0e06c281c8f7.png">
* Now remembers the size / position of the window between app launches
* The error for when you run into Github rate limiting is now better & all caught errors now have a `retry` button on them (works particularly well if you move away from whatever tab caused the error) meaning the app'll need a full restart less
* A handful of smaller QOL improvements (but nothing major)

## What's Changed
* Adds a UI for viewing the core settings by [@neil-morrison44](https://github.com/neil-morrison44) in [#41](https://github.com/neil-morrison44/pocket-sync/pull/41)
* Switches to the new inventory & stops the annoying refresh thing every 15 minutes by [@neil-morrison44](https://github.com/neil-morrison44) in [#42](https://github.com/neil-morrison44/pocket-sync/pull/42)
* Better error for rate limiting & window remembers position by [@neil-morrison44](https://github.com/neil-morrison44) in [#43](https://github.com/neil-morrison44/pocket-sync/pull/43)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.7.0...v2.0.0

---

As usual github takes ~14 minutes to build & attach the downloads so if they're not there yet they'll appear below soon

[Changes][v2.0.0]


<a id="v1.7.0"></a>
# [v1.7.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.7.0) - 2022-12-20

## What's Changed
* Adds core input section to the core page by [@neil-morrison44](https://github.com/neil-morrison44) in [#37](https://github.com/neil-morrison44/pocket-sync/pull/37)

<img width="992" alt="Screenshot 2022-12-20 at 21 59 31" src="https://user-images.githubusercontent.com/2095051/208776574-9d431e7d-c309-4541-ae23-4e8a1b7514dd.png">

- Also fixes issue where the "year" was being incorrectly set as text instead of a number


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.6.1...v1.7.0

---

it takes github ~14 minutes to build the downloads & attach them below, so if they're not there then they'll be there soon.

[Changes][v1.7.0]


<a id="v1.6.1"></a>
# [v1.6.1](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.6.1) - 2022-12-12

## What's Changed
* Adds deep links throughout the app by [@neil-morrison44](https://github.com/neil-morrison44) in [#33](https://github.com/neil-morrison44/pocket-sync/pull/33)

- Now you can go straight from a Core's info page to the platform page then back to the specific core, or from a screenshot to the core that took the screenshot etc

<img width="1045" alt="Screenshot 2022-12-12 at 00 28 54" src="https://user-images.githubusercontent.com/2095051/206938802-f2413caa-acd7-4bee-81bf-be0b2cf87017.png">

- Also fixes an issue with older versions of macOS


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.6.0...v1.6.1

---

Github takes ~14 minutes to build & attach the releases below

[Changes][v1.6.1]


<a id="v1.6.0"></a>
# [v1.6.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.6.0) - 2022-12-11

## What's Changed
* Adds a toggle to just show cores with updates by [@neil-morrison44](https://github.com/neil-morrison44) in [#31](https://github.com/neil-morrison44/pocket-sync/pull/31)

<img width="1300" alt="Screenshot 2022-12-11 at 02 39 13" src="https://user-images.githubusercontent.com/2095051/206883815-2b222b48-ba63-42a8-976e-3ade64b79fb3.png">

- Adds a toggle which'll filter the cores list to _just_ cores with available updates, rather than having to scroll through them looking for the green bits
- Also changes the `category` selector to make it reactive to any changes to category names you've made & show categories for cores which aren't yet in the inventory (as well as the inventory ones)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.5.1...v1.6.0

---

As usual, github'll take ~14 minutes to build & attach the download links below, I looked into working around this by using a draft release but draft releases can't trigger github workflows so 🤷🏻‍♂️ 

[Changes][v1.6.0]


<a id="v1.5.1"></a>
# [v1.5.1](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.5.1) - 2022-12-09

## What's Changed
* Speeds up showing grid items by only loading on screen ones by [@neil-morrison44](https://github.com/neil-morrison44) in [#30](https://github.com/neil-morrison44/pocket-sync/pull/30)

- Now there's loads of cores there's a long wait before the list becomes usable, especially if the Pocket's connected over direct USB, now it'll just load what's shown on screen to cut down on the wait. Also works for screenshots & platforms. 

- Also slims down the app by turning off a bunch of unused features which _hopefully_ sorts out the issue with the MSI installer
- And hopefully a re-run helps whatever caused the MacOS build to take ages then corrupt the icon...

(v1.5.0 had a dependency compatibility issue)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.4.3...v1.5.1

---

Github can take a while (14 - 30 mins) to add the downloads below

[Changes][v1.5.1]


<a id="v1.5.0"></a>
# [v1.5.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.5.0) - 2022-12-09

## What's Changed
* Speeds up showing grid items by only loading on screen ones by [@neil-morrison44](https://github.com/neil-morrison44) in [#30](https://github.com/neil-morrison44/pocket-sync/pull/30)

- Now there's loads of cores there's a long wait before the list becomes usable, especially if the Pocket's connected over direct USB, now it'll just load what's shown on screen to cut down on the wait. Also works for screenshots & platforms. 

- Also slims down the app by turning off a bunch of unused features which _hopefully_ sorts out the issue with the MSI installer
- And hopefully a re-run helps whatever caused the MacOS build to take ages then corrupt the icon...


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.4.3...v1.5.0

---

Github can take a while (14 - 30 mins) to add the downloads below

[Changes][v1.5.0]


<a id="v1.4.3"></a>
# [v1.4.3](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.4.3) - 2022-12-09

## What's Changed
* Fixes some longstanding windows issues by [@neil-morrison44](https://github.com/neil-morrison44) in [#28](https://github.com/neil-morrison44/pocket-sync/pull/28)
* Hides required files if there aren't any by [@neil-morrison44](https://github.com/neil-morrison44) in [#29](https://github.com/neil-morrison44/pocket-sync/pull/29)

- Save States & Saves should now work much better on windows, some UI things fixed there too
- Required Files button no longer shows when the core has no bios / required roms etc

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.4.2...v1.4.3

---

Github takes ~14 minutes to attach the releases below, so they'll be there shortly if they're not already

[Changes][v1.4.3]


<a id="v1.4.2"></a>
# [v1.4.2](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.4.2) - 2022-12-07

## What's Changed
* Fixes cartridge game save states & screenshots, also windows save backups by [@neil-morrison44](https://github.com/neil-morrison44) in [#25](https://github.com/neil-morrison44/pocket-sync/pull/25)

- Cartridge based save states & screenshots are now output, unfortunately they contain a lot less metadata than the OpenFPGA core ones so screenshots don't know the name of the game & all cartridge save states get lumped together
- Windows save backup zips are being built now at least, also fixes 1 UI thing I noticed being off in windows (but there's others still...)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.4.1...v1.4.2

---

Github can take ~14 minutes to attach the builds below, so if they're not there yet they'll be there soon

[Changes][v1.4.2]


<a id="v1.4.1"></a>
# [v1.4.1](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.4.1) - 2022-12-06

## What's Changed
* Couple of minor tweaks to the save state list by [@neil-morrison44](https://github.com/neil-morrison44) in [#22](https://github.com/neil-morrison44/pocket-sync/pull/22)


<img width="868" alt="Screenshot 2022-12-05 at 22 48 15" src="https://user-images.githubusercontent.com/2095051/205775155-6895d1b4-5947-41e9-8bb3-d1d0f6ddf0f7.png">

- Won't show titles for empty groups after a search anymore
- Lists the core author name as well as the short name (since multiple cores for the same platform might have different save slots)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.4.0...v1.4.1

---

Github'll take ~14 minutes to attach the builds to this release

[Changes][v1.4.1]


<a id="v1.4.0"></a>
# [v1.4.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.4.0) - 2022-12-02

## What's Changed
* Adds UI for removing dot files etc, misc UI things, uses real version number by [@neil-morrison44](https://github.com/neil-morrison44) in [#19](https://github.com/neil-morrison44/pocket-sync/pull/19)

- New option in `Games` to remove "cleanable" files (`._*` & `.DS_Store` for now, more later)
   
<img width="1284" alt="Screenshot 2022-12-02 at 14 59 44" src="https://user-images.githubusercontent.com/2095051/205331668-dbc438c6-f89c-4f64-b00b-1849d06144a0.png">

- Also tweaked some UI to better fit in narrow screens (removed years & seconds from the save header, narrowed down the buttons in the image editor)

- Switched to using the real `version` number now given by the inventory which'll remove the incorrect "updates" showing up for NeoGeo & PDP-1 (but also the real v1.3.0 update for GameGear since it's still 1.2.0 in the data)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.3.0...v1.4.0

---

- Github takes ~14 mins to attach the files below, so if they're not there they should be soon

[Changes][v1.4.0]


<a id="v1.3.0"></a>
# [v1.3.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.3.0) - 2022-11-30

## What's Changed
* Enables browsing & bulk deleting save states by [@neil-morrison44](https://github.com/neil-morrison44) in [#17](https://github.com/neil-morrison44/pocket-sync/pull/17)
* Improves error reporting & some hook tidyups by [@neil-morrison44](https://github.com/neil-morrison44) in [#18](https://github.com/neil-morrison44/pocket-sync/pull/18)


<img width="1280" alt="Screenshot 2022-11-29 at 23 54 26" src="https://user-images.githubusercontent.com/2095051/204685735-a78df9b4-b094-4008-8c72-9a82252c5a7c.png">

- Can now see, search for, & bulk delete save states
- Only works for save states created on v1.1 beta 6 or newer (the ones with the thumbnail), the pocket itself will still display the old ones but I'm only reading the latest format
- Probably only works for OpenFPGA cores, not sure how cartridge ones work in the post-thumbnail era

- Also improved how errors show up (shouldn't be any more blank pages, unless the very 1st page errors) with a link into the github issues

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.2.1...v1.3.0

---

As before, Github takes ~14 minutes to build the app for the different platforms, so if the files aren't listed below you'll need to wait a bit

[Changes][v1.3.0]


<a id="v1.2.1"></a>
# [v1.2.1](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.2.1) - 2022-11-28

## What's Changed
* Fix missing platform images by [@neil-morrison44](https://github.com/neil-morrison44) in [#14](https://github.com/neil-morrison44/pocket-sync/pull/14)

- Fixes issue showing JOTEGO double dragon cores (or any other core which doesn't have a platform image)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.2.0...v1.2.1

---

If the apps haven't appeared below Github can take ~14 minutes to build & attach them so they'll appear soon

[Changes][v1.2.1]


<a id="v1.2.0"></a>
# [v1.2.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.2.0) - 2022-11-27

## What's Changed
* Platform editing by [@neil-morrison44](https://github.com/neil-morrison44) in [#13](https://github.com/neil-morrison44/pocket-sync/pull/13)

<img width="1322" alt="Screenshot 2022-11-27 at 16 25 44" src="https://user-images.githubusercontent.com/2095051/204151332-cd3baeb0-e31d-45c8-8b62-fdf3fefbd21c.png">
<img width="1322" alt="Screenshot 2022-11-27 at 16 24 34" src="https://user-images.githubusercontent.com/2095051/204151335-6ac0f4c8-ee77-487a-afe9-8e338743e334.png">

- Adds a new tab, "Platforms" showing all the platforms
- Supports changing the platform metadata
  - `Category` will suggest the current Categories but also let you type your own
  - Images (jpg, png) can be imported, composited, converted, & saved within the app

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.1.0...v1.2.0

---

Github takes ~14 minutes to add the builds to releases, so if they're not below yet they'll be there soon

[Changes][v1.2.0]


<a id="v1.1.0"></a>
# [v1.1.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.1.0) - 2022-11-26

## What's Changed
* Improves the game count in [#7](https://github.com/neil-morrison44/pocket-sync/pull/7)
* Better save management UI in [#10](https://github.com/neil-morrison44/pocket-sync/pull/10)
* Improves search everywhere by in [#11](https://github.com/neil-morrison44/pocket-sync/pull/11)

<img width="1293" alt="Screenshot 2022-11-26 at 00 03 25" src="https://user-images.githubusercontent.com/2095051/204070539-aee27075-44a2-412a-8cfc-09ba2e92baa7.png">

The saves UI is now much better:
- it checks on the pocket to see if the backups are different from the "current" save
- saves which haven't changed from the save on the pocket itself are hidden by default
- can see which backup the save changed in etc

Search is improved a lot:
- Now it searches across different fields (like platform name, year, manufacturer, core author, etc)
- Also added search into the screenshots view searching game & system

- Fixes a crash when selecting boogermann's supervision core
- Some slight UI tweaks


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.0.2...v1.1.0

---

- The releases take ~14 minutes to be added below, so if this release is new they'll appear once Github processes them

[Changes][v1.1.0]


<a id="v1.0.2"></a>
# [v1.0.2](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.0.2) - 2022-11-22

## What's Changed
* Fixes inability to click the games list items on Windows by [@neil-morrison44](https://github.com/neil-morrison44) in [#6](https://github.com/neil-morrison44/pocket-sync/pull/6)


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.0.1...v1.0.2

[Changes][v1.0.2]


<a id="v1.0.1"></a>
# [v1.0.1](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.0.1) - 2022-11-21

- Automatically toggles known "bad" files (MacOS's `.DS_Store` files & git's `.keep` files) when installing zips

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v1.0.0...v1.0.1

[Changes][v1.0.1]


<a id="v1.0.0"></a>
# [v1.0.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v1.0.0) - 2022-11-21

## What's Changed
* Fully replaces the CLI with a GUI version by [@neil-morrison44](https://github.com/neil-morrison44) in [#1](https://github.com/neil-morrison44/pocket-sync/pull/1)

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v0.2.0...v1.0.0

[Changes][v1.0.0]


<a id="v0.2.0"></a>
# [v0.2.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v0.2.0) - 2022-11-03

- Now shows the conflict view always if the MiSTer save was done without a proper network / RTC timestamp
- Now has a look in the pocket filesystem for the ROM to find where saves should go when it comes across a MiSTer-only game 


**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/compare/v0.1.0...v0.2.0

[Changes][v0.2.0]


<a id="v0.1.0"></a>
# [v0.1.0](https://github.com/neil-morrison44/pocket-sync/releases/tag/v0.1.0) - 2022-10-30

- First release, there's probably still some bugs, don't trust it yet

**Full Changelog**: https://github.com/neil-morrison44/pocket-sync/commits/v0.1.0

[Changes][v0.1.0]


[v5.9.0]: https://github.com/neil-morrison44/pocket-sync/compare/v5.8.0...v5.9.0
[v5.8.0]: https://github.com/neil-morrison44/pocket-sync/compare/v5.7.5...v5.8.0
[v5.7.5]: https://github.com/neil-morrison44/pocket-sync/compare/v5.7.4...v5.7.5
[v5.7.4]: https://github.com/neil-morrison44/pocket-sync/compare/v5.7.3...v5.7.4
[v5.7.3]: https://github.com/neil-morrison44/pocket-sync/compare/v5.7.2...v5.7.3
[v5.7.2]: https://github.com/neil-morrison44/pocket-sync/compare/v5.7.1...v5.7.2
[v5.7.1]: https://github.com/neil-morrison44/pocket-sync/compare/v5.7.0...v5.7.1
[v5.7.0]: https://github.com/neil-morrison44/pocket-sync/compare/v5.6.2...v5.7.0
[v5.6.2]: https://github.com/neil-morrison44/pocket-sync/compare/v5.6.1...v5.6.2
[v5.6.1]: https://github.com/neil-morrison44/pocket-sync/compare/v5.6.0...v5.6.1
[v5.6.0]: https://github.com/neil-morrison44/pocket-sync/compare/v5.5.0...v5.6.0
[v5.5.0]: https://github.com/neil-morrison44/pocket-sync/compare/v5.4.0...v5.5.0
[v5.4.0]: https://github.com/neil-morrison44/pocket-sync/compare/v5.3.0...v5.4.0
[v5.3.0]: https://github.com/neil-morrison44/pocket-sync/compare/v5.2.0...v5.3.0
[v5.2.0]: https://github.com/neil-morrison44/pocket-sync/compare/v5.1.0...v5.2.0
[v5.1.0]: https://github.com/neil-morrison44/pocket-sync/compare/v5.0.2...v5.1.0
[v5.0.2]: https://github.com/neil-morrison44/pocket-sync/compare/v5.0.1...v5.0.2
[v5.0.1]: https://github.com/neil-morrison44/pocket-sync/compare/v5.0.0...v5.0.1
[v5.0.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.12.1...v5.0.0
[v4.12.1]: https://github.com/neil-morrison44/pocket-sync/compare/v4.12.0...v4.12.1
[v4.12.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.11.0...v4.12.0
[v4.11.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.10.0...v4.11.0
[v4.10.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.9.1...v4.10.0
[v4.9.1]: https://github.com/neil-morrison44/pocket-sync/compare/v4.9.0...v4.9.1
[v4.9.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.8.1...v4.9.0
[v4.8.1]: https://github.com/neil-morrison44/pocket-sync/compare/v4.8.0...v4.8.1
[v4.8.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.7.0...v4.8.0
[v4.7.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.6.1...v4.7.0
[v4.6.1]: https://github.com/neil-morrison44/pocket-sync/compare/v4.6.0...v4.6.1
[v4.6.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.5.1...v4.6.0
[v4.5.1]: https://github.com/neil-morrison44/pocket-sync/compare/v4.5.0...v4.5.1
[v4.5.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.4.0...v4.5.0
[v4.4.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.3.1...v4.4.0
[v4.3.1]: https://github.com/neil-morrison44/pocket-sync/compare/v4.3.0...v4.3.1
[v4.3.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.2.2...v4.3.0
[v4.2.2]: https://github.com/neil-morrison44/pocket-sync/compare/v4.2.1...v4.2.2
[v4.2.1]: https://github.com/neil-morrison44/pocket-sync/compare/v4.2.0...v4.2.1
[v4.2.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.1.0...v4.2.0
[v4.1.0]: https://github.com/neil-morrison44/pocket-sync/compare/v4.0.0...v4.1.0
[v4.0.0]: https://github.com/neil-morrison44/pocket-sync/compare/v3.11.2...v4.0.0
[v3.11.2]: https://github.com/neil-morrison44/pocket-sync/compare/v3.11.1...v3.11.2
[v3.11.1]: https://github.com/neil-morrison44/pocket-sync/compare/v3.11.0...v3.11.1
[v3.11.0]: https://github.com/neil-morrison44/pocket-sync/compare/v3.10.1...v3.11.0
[v3.10.1]: https://github.com/neil-morrison44/pocket-sync/compare/v3.10.0...v3.10.1
[v3.10.0]: https://github.com/neil-morrison44/pocket-sync/compare/v3.9.3...v3.10.0
[v3.9.3]: https://github.com/neil-morrison44/pocket-sync/compare/v3.9.2...v3.9.3
[v3.9.2]: https://github.com/neil-morrison44/pocket-sync/compare/v3.9.1...v3.9.2
[v3.9.1]: https://github.com/neil-morrison44/pocket-sync/compare/v3.9.0...v3.9.1
[v3.9.0]: https://github.com/neil-morrison44/pocket-sync/compare/v3.8.1...v3.9.0
[v3.8.1]: https://github.com/neil-morrison44/pocket-sync/compare/v3.8.0...v3.8.1
[v3.8.0]: https://github.com/neil-morrison44/pocket-sync/compare/v3.7.3...v3.8.0
[v3.7.3]: https://github.com/neil-morrison44/pocket-sync/compare/v3.7.2...v3.7.3
[v3.7.2]: https://github.com/neil-morrison44/pocket-sync/compare/v3.7.1...v3.7.2
[v3.7.1]: https://github.com/neil-morrison44/pocket-sync/compare/v3.7.0...v3.7.1
[v3.7.0]: https://github.com/neil-morrison44/pocket-sync/compare/v3.6.0...v3.7.0
[v3.6.0]: https://github.com/neil-morrison44/pocket-sync/compare/v3.5.3...v3.6.0
[v3.5.3]: https://github.com/neil-morrison44/pocket-sync/compare/v3.5.2...v3.5.3
[v3.5.2]: https://github.com/neil-morrison44/pocket-sync/compare/v3.5.1...v3.5.2
[v3.5.1]: https://github.com/neil-morrison44/pocket-sync/compare/v3.5.0...v3.5.1
[v3.5.0]: https://github.com/neil-morrison44/pocket-sync/compare/v3.4.0...v3.5.0
[v3.4.0]: https://github.com/neil-morrison44/pocket-sync/compare/v3.3.0...v3.4.0
[v3.3.0]: https://github.com/neil-morrison44/pocket-sync/compare/v3.2.1...v3.3.0
[v3.2.1]: https://github.com/neil-morrison44/pocket-sync/compare/v3.2.0...v3.2.1
[v3.2.0]: https://github.com/neil-morrison44/pocket-sync/compare/v3.1.0...v3.2.0
[v3.1.0]: https://github.com/neil-morrison44/pocket-sync/compare/v3.0.1...v3.1.0
[v3.0.1]: https://github.com/neil-morrison44/pocket-sync/compare/v3.0.0...v3.0.1
[v3.0.0]: https://github.com/neil-morrison44/pocket-sync/compare/v2.9.0...v3.0.0
[v2.9.0]: https://github.com/neil-morrison44/pocket-sync/compare/v2.8.1...v2.9.0
[v2.8.1]: https://github.com/neil-morrison44/pocket-sync/compare/v2.8.0...v2.8.1
[v2.8.0]: https://github.com/neil-morrison44/pocket-sync/compare/v2.7.0...v2.8.0
[v2.7.0]: https://github.com/neil-morrison44/pocket-sync/compare/v2.6.3...v2.7.0
[v2.6.3]: https://github.com/neil-morrison44/pocket-sync/compare/v2.6.2...v2.6.3
[v2.6.2]: https://github.com/neil-morrison44/pocket-sync/compare/v2.6.1...v2.6.2
[v2.6.1]: https://github.com/neil-morrison44/pocket-sync/compare/v2.6.0...v2.6.1
[v2.6.0]: https://github.com/neil-morrison44/pocket-sync/compare/v2.5.0...v2.6.0
[v2.5.0]: https://github.com/neil-morrison44/pocket-sync/compare/v2.4.0...v2.5.0
[v2.4.0]: https://github.com/neil-morrison44/pocket-sync/compare/v2.3.0...v2.4.0
[v2.3.0]: https://github.com/neil-morrison44/pocket-sync/compare/v2.2.1...v2.3.0
[v2.2.1]: https://github.com/neil-morrison44/pocket-sync/compare/v2.2.0...v2.2.1
[v2.2.0]: https://github.com/neil-morrison44/pocket-sync/compare/v2.1.0...v2.2.0
[v2.1.0]: https://github.com/neil-morrison44/pocket-sync/compare/v2.0.1...v2.1.0
[v2.0.1]: https://github.com/neil-morrison44/pocket-sync/compare/v2.0.0...v2.0.1
[v2.0.0]: https://github.com/neil-morrison44/pocket-sync/compare/v1.7.0...v2.0.0
[v1.7.0]: https://github.com/neil-morrison44/pocket-sync/compare/v1.6.1...v1.7.0
[v1.6.1]: https://github.com/neil-morrison44/pocket-sync/compare/v1.6.0...v1.6.1
[v1.6.0]: https://github.com/neil-morrison44/pocket-sync/compare/v1.5.1...v1.6.0
[v1.5.1]: https://github.com/neil-morrison44/pocket-sync/compare/v1.5.0...v1.5.1
[v1.5.0]: https://github.com/neil-morrison44/pocket-sync/compare/v1.4.3...v1.5.0
[v1.4.3]: https://github.com/neil-morrison44/pocket-sync/compare/v1.4.2...v1.4.3
[v1.4.2]: https://github.com/neil-morrison44/pocket-sync/compare/v1.4.1...v1.4.2
[v1.4.1]: https://github.com/neil-morrison44/pocket-sync/compare/v1.4.0...v1.4.1
[v1.4.0]: https://github.com/neil-morrison44/pocket-sync/compare/v1.3.0...v1.4.0
[v1.3.0]: https://github.com/neil-morrison44/pocket-sync/compare/v1.2.1...v1.3.0
[v1.2.1]: https://github.com/neil-morrison44/pocket-sync/compare/v1.2.0...v1.2.1
[v1.2.0]: https://github.com/neil-morrison44/pocket-sync/compare/v1.1.0...v1.2.0
[v1.1.0]: https://github.com/neil-morrison44/pocket-sync/compare/v1.0.2...v1.1.0
[v1.0.2]: https://github.com/neil-morrison44/pocket-sync/compare/v1.0.1...v1.0.2
[v1.0.1]: https://github.com/neil-morrison44/pocket-sync/compare/v1.0.0...v1.0.1
[v1.0.0]: https://github.com/neil-morrison44/pocket-sync/compare/v0.2.0...v1.0.0
[v0.2.0]: https://github.com/neil-morrison44/pocket-sync/compare/v0.1.0...v0.2.0
[v0.1.0]: https://github.com/neil-morrison44/pocket-sync/tree/v0.1.0

<!-- Generated by https://github.com/rhysd/changelog-from-release v3.9.0 -->
