import { listen } from "@tauri-apps/api/event"
import { useEffect } from "react"
import { useSetRecoilState } from "recoil"
import { useInvalidateFileSystem } from "../../hooks/invalidation"
import { pocketPathAtom } from "../../recoil/atoms"

export const Disconnections = () => {
  const setPocketPath = useSetRecoilState(pocketPathAtom)
  const invalidateFileSystem = useInvalidateFileSystem()

  useEffect(() => {
    const unlisten = listen<{ connected: boolean }>(
      "pocket-connection",
      ({ payload }) => {
        if (!payload.connected) {
          setPocketPath(null)
          setTimeout(() => {
            invalidateFileSystem()
          }, 50)
        }
      }
    )

    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  return null
}
