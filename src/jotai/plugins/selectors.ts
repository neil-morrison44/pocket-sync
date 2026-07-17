import { atom } from "jotai"
import { PocketSyncConfigSelector } from "../config/selectors"
import { githubTokenAtom } from "../settings/atoms"
import { invokeListAndInstallPlugins } from "../../utils/invokes"
import { PocketPluginInfo } from "../../types"
import { atomWithRefresh } from "jotai/utils"

export const pluginListSelector = atomWithRefresh<Promise<PocketPluginInfo[]>>(
  async (get) => {
    const config = await get(PocketSyncConfigSelector)
    const plugins = config.plugins || []
    const githubToken = await get(githubTokenAtom)

    return await invokeListAndInstallPlugins(plugins, githubToken.value)
  }
)
