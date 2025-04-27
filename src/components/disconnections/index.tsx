import { listen } from "@tauri-apps/api/event"
import { useCallback, useEffect } from "react"
import { useDisconnectPocket } from "../../hooks/useDisconnectPocket"
import { useAtomCallback } from "jotai/utils"

export const Disconnections = () => {
  const onDisconnect = useDisconnectPocket()

  const clearAllSelectorCaches = useAtomCallback(
    useCallback(
      (get, set) => () => {
        // TODO: this but jotai
        // for (const node of snapshot.getNodes_UNSTABLE()) {
        //   refresh(node)
        // }
      },
      []
    )
  )

  useEffect(() => {
    const unlisten = listen<{ connected: boolean }>(
      "pocket-connection",
      ({ payload }) => {
        console.log("disconnected?")
        if (!payload.connected) {
          onDisconnect()
          clearAllSelectorCaches()
        }
      }
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [clearAllSelectorCaches, onDisconnect])

  return null
}
