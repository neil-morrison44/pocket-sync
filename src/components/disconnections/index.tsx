import { listen } from "@tauri-apps/api/event"
import { useEffect } from "react"
import { useDisconnectPocket } from "../../hooks/useDisconnectPocket"
import { useRecoilCallback } from "recoil"

export const Disconnections = () => {
  const onDisconnect = useDisconnectPocket()

  const clearAllSelectorCaches = useRecoilCallback(
    ({ snapshot, refresh }) =>
      () => {
        for (const node of snapshot.getNodes_UNSTABLE()) {
          refresh(node)
        }
      }
  )

  useEffect(() => {
    const unlisten = listen<{ connected: boolean }>(
      "pocket-connection",
      ({ payload }) => {
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
