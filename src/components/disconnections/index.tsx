import { listen } from "@tauri-apps/api/event"
import { useEffect } from "react"
import { useDisconnectPocket } from "../../hooks/useDisconnectPocket"
import { useRecoilCallback, useRecoilValue } from "recoil"
import { pocketPathAtom } from "../../recoil/atoms"

export const Disconnections = () => {
  const onDisconnect = useDisconnectPocket()
  const pocketPath = useRecoilValue(pocketPathAtom)

  const updateFSWatchAtoms = useRecoilCallback(
    ({ snapshot }) =>
      (paths: string[]) => {
        const nodes = Array.from(snapshot.getNodes_UNSTABLE()).filter(
          (n) =>
            n.key.startsWith("FileWatchAtomFamily") ||
            n.key.startsWith("FolderWatchAtomFamily")
        )
        console.log({ nodes, paths, pocketPath })

        const nodesToUpdate = nodes.filter((node) =>
          paths.some((path) =>
            node.key.includes(
              console.log(path.replace(`${pocketPath || ""}/`, "")) ||
                path.replace(`${pocketPath || ""}/`, "")
            )
          )
        )

        console.log({ nodesToUpdate })
      },
    []
  )

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
  }, [onDisconnect])

  // useEffect(() => {
  //   const unlisten = listen<FSEvent[]>("pocket-fs-event", ({ payload }) => {
  //     // console.log({ payload })
  //     updateFSWatchAtoms(payload.flatMap(({ paths }) => paths))
  //   })
  //   return () => {
  //     unlisten.then((l) => l())
  //   }
  // }, [])

  return null
}
