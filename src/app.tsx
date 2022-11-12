import { invoke } from "@tauri-apps/api/tauri"
import "./font.css"
import "./app.css"
import { useRecoilState } from "recoil"
import { pocketPathAtom } from "./recoil/atoms"
import { Layout } from "./components/layout"

export const App = () => {
  const [pocketPath, setPocketPath] = useRecoilState(pocketPathAtom)

  async function openPocket() {
    setPocketPath(await invoke("open_pocket"))
  }

  if (pocketPath) {
    return <Layout />
  }

  return (
    <div className="container">
      <h1>Pocket Sync</h1>

      <div className="row">
        <button type="button" onClick={() => openPocket()}>
          Connect to Pocket
        </button>
      </div>
    </div>
  )
}
