import { atomWithAppLocalSetting } from "../../utils/jotai"
import { PocketPluginInfo } from "../../types"

/**
 * Development only (Settings → Developer): list made-up plugins next to the
 * installed ones, to look at the Plugins page. Nothing is installed.
 */
export const demoPluginsAtom = atomWithAppLocalSetting<boolean>(
  "dev_demo_plugins",
  false
)

/** Ids of the made-up plugins start with this; they can't really run. */
export const DEMO_PLUGIN_PREFIX = "demo-"

/**
 * The made-up plugins: two authors, so the Author filter shows. Empty in
 * production builds, so they don't ship.
 */
export const DEMO_PLUGINS: PocketPluginInfo[] = !import.meta.env.DEV
  ? []
  : [
      {
        id: `${DEMO_PLUGIN_PREFIX}library-sorter`,
        version: "1.2.0",
        name: "Library Sorter",
        github_url: "https://github.com/example-dev/pocket-library-sorter",
        description:
          "Sorts the games in each Assets folder into A–Z subfolders, so long lists are quicker to browse on the Pocket.",
      },
      {
        id: `${DEMO_PLUGIN_PREFIX}save-renamer`,
        version: "0.4.1",
        name: "Save Renamer",
        github_url: "https://github.com/example-dev/pocket-save-renamer",
        description:
          "Renames save files to match their games after the games were renamed.",
      },
      {
        id: `${DEMO_PLUGIN_PREFIX}screenshot-tagger`,
        version: "2.0.0",
        name: "Screenshot Tagger",
        github_url: "https://github.com/another-dev/screenshot-tagger",
      },
    ]
