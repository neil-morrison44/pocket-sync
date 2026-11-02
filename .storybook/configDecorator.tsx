import type { ReactNode } from "react"
import { Provider, createStore } from "jotai"
import { configChangesAtom } from "../src/jotai/config/selectors"
import type { PocketSyncConfig } from "../src/types"

// A minimal, deterministic config so config-driven stories don't depend on a
// connected Pocket, and don't hit the random black/white default the selector
// produces when none is attached.
const baseConfig: PocketSyncConfig = {
  version: "1.0.0",
  colour: "black",
  archive_url: null,
  saves: [],
  skipAlternateAssets: true,
  hidden_cores: [],
  plugins: [],
}

// The slice of story context this decorator reads from.
type DecoratorContext = {
  parameters?: { pocketSyncConfig?: Partial<PocketSyncConfig> }
}

/**
 * Seed a deterministic `PocketSyncConfig` for a story.
 *
 * Reads the desired values from the story's `parameters.config` (merged over a
 * sane base) and writes them to the `configChangesAtom` override — the same
 * atom the app writes when the user edits settings — on a dedicated jotai
 * store provided to the story.
 *
 * Register once (e.g. `decorators: [withConfig]` in `meta`), then vary per
 * story via parameters so `args` still map to the real component props:
 *
 *   parameters: { pocketSyncConfig: { colour: "yellow", button_colour: "pink" } }
 */
export const withConfig = (
  Story: () => ReactNode,
  context: DecoratorContext
) => {
  const store = createStore()
  store.set(configChangesAtom, {
    ...baseConfig,
    ...context.parameters?.pocketSyncConfig,
  })

  return <Provider store={store}>{Story()}</Provider>
}
