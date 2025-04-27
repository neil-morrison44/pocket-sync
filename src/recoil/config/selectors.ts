import { PocketSyncConfig } from "../../types"
import { invokeFileExists, invokeSaveFile } from "../../utils/invokes"
import { readJSONFile } from "../../utils/readJSONFile"
import { pocketPathAtom } from "../atoms"
import { AppVersionSelector } from "../selectors"
import { atom } from "jotai"

export const configChangesAtom = atom<PocketSyncConfig | null>(null)

export const PocketSyncConfigSelector = atom(
  async (get) => {
    const configChanges = get(configChangesAtom)
    if (configChanges !== null) return configChanges

    const pocketPath = get(pocketPathAtom)
    const file = "pocket-sync.json"
    const path = `${pocketPath}/${file}`

    if (!pocketPath) {
      return {
        version: await get(AppVersionSelector),
        colour: Math.random() > 0.5 ? "white" : "black",
        archive_url: null,
        saves: [],
        skipAlternateAssets: true,
        hidden_cores: [],
      } satisfies PocketSyncConfig
    }

    const exists = await invokeFileExists(file)
    if (!exists) {
      const defaultConfig = {
        version: await get(AppVersionSelector),
        colour: "black",
        archive_url: null,
        saves: [],
        skipAlternateAssets: true,
        hidden_cores: [],
        gb_palette_convert: true,
      } satisfies PocketSyncConfig
      const encoder = new TextEncoder()
      await invokeSaveFile(
        path,
        encoder.encode(JSON.stringify(defaultConfig, null, 2))
      )
    }

    return readJSONFile<PocketSyncConfig>(file)
  },
  async (get, set, newConfig: PocketSyncConfig) => {
    const pocketPath = get(pocketPathAtom)
    const file = "pocket-sync.json"
    const path = `${pocketPath}/${file}`
    const encoder = new TextEncoder()

    set(configChangesAtom, newConfig)

    await invokeSaveFile(
      path,
      encoder.encode(JSON.stringify(newConfig, null, 2))
    )
  }
)

export const skipAlternateAssetsSelector = atom<Promise<boolean>>(
  async (get) => {
    const config = await get(PocketSyncConfigSelector)

    return (
      config.skipAlternateAssets === undefined || config.skipAlternateAssets
    )
  }
)
