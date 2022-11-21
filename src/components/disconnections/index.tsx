import { listen } from "@tauri-apps/api/event"
import { useEffect } from "react"
import { useSetRecoilState } from "recoil"
import { fileSystemInvalidationAtom, pocketPathAtom } from "../../recoil/atoms"

export const Disconnections = () => {
  const setPocketPath = useSetRecoilState(pocketPathAtom)
  const setFileSystemInvalidation = useSetRecoilState(
    fileSystemInvalidationAtom
  )

  useEffect(() => {
    const unlisten = listen<{ connected: boolean }>(
      "pocket-connection",
      ({ payload }) => {
        if (!payload.connected) {
          setPocketPath(null)
          setTimeout(() => {
            setFileSystemInvalidation(Date.now())
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
