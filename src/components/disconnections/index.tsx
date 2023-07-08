import { listen } from "@tauri-apps/api/event"
import { useEffect } from "react"
import { useDisconnectPocket } from "../../hooks/useDisconnectPocket"

export const Disconnections = () => {
  const onDisconnect = useDisconnectPocket()

  useEffect(() => {
    const unlisten = listen<{ connected: boolean }>(
      "pocket-connection",
      ({ payload }) => {
        if (!payload.connected) onDisconnect()
      }
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  return null
}
