import { PocketSyncConfig } from "../../types"
import { invokeFileExists, invokeSaveFile } from "../../utils/invokes"
import { readJSONFile } from "../../utils/readJSONFile"
import { pocketPathAtom } from "../atoms"
import { AppVersionSelector } from "../selectors"
import { FileWatchAtomFamily } from "../fileSystem/atoms"
import { atom } from "jotai"

export const PocketSyncConfigSelector = atom<Promise<PocketSyncConfig>>(
  async (get) => {
    const pocketPath = get(pocketPathAtom)
    const file = "pocket-sync.json"
    const path = `${pocketPath}/${file}`
    get(FileWatchAtomFamily(file))

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
    console.log("Reading file, ", file)
    return readJSONFile<PocketSyncConfig>(file)
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
