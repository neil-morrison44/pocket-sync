import "./font.css"
import { pocketPathAtom, reconnectWhenOpenedAtom } from "./jotai/atoms"
import { Layout } from "./components/layout"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { invokeOpenPocket, invokeOpenPocketFolder } from "./utils/invokes"
import { currentViewAtom } from "./jotai/view/atoms"
import { useAtom, useSetAtom } from "jotai"
import { useAtomFnSet } from "./utils/jotai"
import { refreshAllFSWatchers } from "./jotai/fileSystem/atoms"

export const App = () => {
  const [pocketPath, setPocketPath] = useAtom(pocketPathAtom)
  const [reconnectWhenOpened, setReconnectWhenOpened] = useAtomFnSet(
    reconnectWhenOpenedAtom
  )
  const setView = useSetAtom(currentViewAtom)
  const [attempts, setAttempts] = useState(0)
  const reconnectRef = useRef<boolean>(false)

  useEffect(() => {
    if (reconnectRef.current) return
    reconnectRef.current = true

    if (reconnectWhenOpened.enable && reconnectWhenOpened.path) {
      invokeOpenPocketFolder(reconnectWhenOpened.path).then((result) => {
        if (result) {
          setView({ view: "Pocket Sync", selected: null })
          setPocketPath(result)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Another folder or card may be connected now: read everything again
  // instead of showing what was cached from the previous one
  useEffect(() => {
    if (pocketPath) refreshAllFSWatchers()
  }, [pocketPath])

  const onOpenPocket = useCallback(async () => {
    const result = await invokeOpenPocket()

    setView({ view: "Pocket Sync", selected: null })
    setPocketPath(result)
    if (result === null) {
      setAttempts((a) => a + 1)
    } else {
      setReconnectWhenOpened((r) => ({ ...r, path: result }))
      setAttempts(0)
    }
  }, [setView, setPocketPath, setReconnectWhenOpened])

  return (
    <Suspense>
      <Layout
        connection={{
          connected: Boolean(pocketPath),
          onConnect: onOpenPocket,
          attempts,
        }}
      />
    </Suspense>
  )
}
