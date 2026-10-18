import { WebviewWindow } from "@tauri-apps/api/webviewWindow"
import { useCallback, useState } from "react"

export const usePluginRunner = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const openPluginWindow = useCallback(
    async (pluginId: string, pluginName: string) => {
      setIsRunning(true)
      const webview = new WebviewWindow(`plugin-${pluginId}`, {
        url: `/plugin/${pluginId}`,
        title: `${pluginName}`,
        width: 600,
        height: 900,
        resizable: true,
        alwaysOnTop: true,
      })

      webview.once("tauri://destroyed", () => setIsRunning(false))
    },
    [setIsRunning]
  )

  return [isRunning, openPluginWindow] as const
}
