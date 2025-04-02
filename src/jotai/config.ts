import { atom } from "jotai"
import { PocketSyncConfig } from "../types"
import { appVersionAtom, pocketPathAtom } from "./general"
import { invokeFileExists, invokeSaveFile } from "../utils/invokes"
import { readJSONFile } from "../utils/readJSONFile"

export const pocketSyncConfigAtom = atom<Promise<PocketSyncConfig>>(
  async (get) => {
    const file = "pocket-sync.json"
    const pocketPath = get(pocketPathAtom)
    console.log({ pocketPath })
    const path = `${pocketPath}/${file}`

    if (!pocketPath) {
      return {
        version: await get(appVersionAtom),
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
        version: await get(appVersionAtom),
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
  }
)
