import { invoke } from "@tauri-apps/api/tauri"
import "./font.css"
import "./app.css"
import { useRecoilState } from "recoil"
import { pocketPathAtom } from "./recoil/atoms"
import { Layout } from "./components/layout"
import React, { Suspense, useCallback, useState } from "react"

const Pocket = React.lazy(() =>
  import("./components/three/pocket").then((m) => ({ default: m.Pocket }))
)

export const App = () => {
  const [pocketPath, setPocketPath] = useRecoilState(pocketPathAtom)
  const [attempts, setAttempts] = useState(0)

  const openPocket = useCallback(async () => {
    setPocketPath(await invoke<string | null>("open_pocket"))
    setAttempts((a) => a + 1)
  }, [setPocketPath, setAttempts])

  if (pocketPath) {
    return <Layout />
  }

  return (
    <div className="container">
      <h1>Pocket Sync</h1>

      <Suspense fallback={<div style={{ flexGrow: 1 }}></div>}>
        <Pocket spin />
      </Suspense>

      {attempts > 0 && (
        <h3>
          {"That folder doesn't look like the Pocket's file system. Try again"}
        </h3>
      )}

      <div className="row">
        <button type="button" onClick={() => openPocket()}>
          Connect to Pocket
        </button>
      </div>
    </div>
  )
}
