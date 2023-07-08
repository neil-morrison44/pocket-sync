import { DefaultValue, selector } from "recoil"
import { PocketSyncConfig } from "../../types"
import { invokeFileExists, invokeSaveFile } from "../../utils/invokes"
import { readJSONFile } from "../../utils/readJSONFile"
import { configInvalidationAtom, pocketPathAtom } from "../atoms"
import { AppVersionSelector } from "../selectors"

export const PocketSyncConfigSelector = selector<PocketSyncConfig>({
  key: "PocketSyncConfigSelector",
  get: async ({ get }) => {
    get(configInvalidationAtom)
    const pocketPath = get(pocketPathAtom)

    if (!pocketPath) {
      return {
        version: get(AppVersionSelector),
        colour: Math.random() > 0.5 ? "white" : "black",
        archive_url: null,
        saves: [],
        skipAlternateAssets: true,
      } satisfies PocketSyncConfig
    }

    const exists = await invokeFileExists("pocket-sync.json")
    if (!exists) {
      const defaultConfig = {
        version: get(AppVersionSelector),
        colour: "black",
        archive_url: null,
        saves: [],
        skipAlternateAssets: true,
      } satisfies PocketSyncConfig

      const encoder = new TextEncoder()

      await invokeSaveFile(
        `${pocketPath}/pocket-sync.json`,
        encoder.encode(JSON.stringify(defaultConfig, null, 2))
      )
    }

    return readJSONFile<PocketSyncConfig>("pocket-sync.json")
  },
})

export const skipAlternateAssetsSelector = selector<boolean>({
  key: "skipAlternateAssetsSelector",
  get: ({ get }) => {
    const config = get(PocketSyncConfigSelector)

    return (
      config.skipAlternateAssets === undefined || config.skipAlternateAssets
    )
  },
})
