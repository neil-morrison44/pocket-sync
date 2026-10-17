import { atom } from "jotai"
import { PocketSyncConfigSelector } from "../config/selectors"
import { githubTokenAtom } from "../settings/atoms"
import { invokeListAndInstallPlugins } from "../../utils/invokes"
import { PocketPluginInfo } from "../../types"
import { atomWithRefresh } from "jotai/utils"
import { DEMO_PLUGINS, demoPluginsAtom } from "./atoms"

export const pluginListSelector = atomWithRefresh<Promise<PocketPluginInfo[]>>(
  async (get) => {
    const config = await get(PocketSyncConfigSelector)
    const plugins = config.plugins || []
    const githubToken = await get(githubTokenAtom)

    const installed = await invokeListAndInstallPlugins(
      plugins,
      githubToken.value
    )
    // Made-up plugins for previews (Settings → Developer), dev builds only
    if (import.meta.env.DEV && (await get(demoPluginsAtom)))
      return [...installed, ...DEMO_PLUGINS]
    return installed
  }
)
