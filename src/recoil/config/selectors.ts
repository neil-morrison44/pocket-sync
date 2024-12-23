import { selector } from "recoil"
import { PocketSyncConfig } from "../../types"
import { invokeFileExists, invokeSaveFile } from "../../utils/invokes"
import { readJSONFile } from "../../utils/readJSONFile"
import { pocketPathAtom } from "../atoms"
import { AppVersionSelector } from "../selectors"
import { FileWatchAtomFamily } from "../fileSystem/atoms"

export const PocketSyncConfigSelector = selector<PocketSyncConfig>({
  key: "PocketSyncConfigSelector",
  get: async ({ get }) => {
    const pocketPath = get(pocketPathAtom)
    const file = "pocket-sync.json"
    const path = `${pocketPath}/${file}`
    get(FileWatchAtomFamily(file))

    if (!pocketPath) {
      return {
        version: get(AppVersionSelector),
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
        version: get(AppVersionSelector),
        colour: "black",
        archive_url: null,
        saves: [],
        skipAlternateAssets: true,
        hidden_cores: [],
      } satisfies PocketSyncConfig
      const encoder = new TextEncoder()
      await invokeSaveFile(
        path,
        encoder.encode(JSON.stringify(defaultConfig, null, 2))
      )
    }

    return readJSONFile<PocketSyncConfig>(file)
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
