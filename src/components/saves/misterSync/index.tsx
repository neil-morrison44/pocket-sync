import { emit, listen } from "@tauri-apps/api/event"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { AllSavesSelector } from "../../../recoil/saves/selectors"
import { invokeBeginMisterSaveSyncSession } from "../../../utils/invokes"
import { splitAsPath } from "../../../utils/splitAsPath"
import { Controls } from "../../controls"
import { Loader } from "../../loader"

import "./index.css"

type MisterSyncProps = {
  onClose: () => void
}

export const MisterSync = ({ onClose }: MisterSyncProps) => {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [selectedSave, setSelectedSave] = useState<string | null>(null)
  const [creds, setCreds] = useState({ host: "", user: "root", password: "1" })

  const connect = useCallback(async () => {
    setConnecting(true)
    const c = await invokeBeginMisterSaveSyncSession(
      creds.host,
      creds.user,
      creds.password
    )
    setConnecting(false)
    setConnected(c)
  }, [creds])

  return (
    <div className="mister-sync">
      <Controls
        controls={[
          {
            type: "back-button",
            text: "Add backup location",
            onClick: onClose,
          },
        ]}
      />

      <SaveStatus key={selectedSave} path={selectedSave || undefined} />
      <div className="mister-sync__content">
        {connected && <SavesList onSelect={setSelectedSave} />}
        {connecting && <Loader />}
        {!connected && !connecting && (
          <div className="mister-sync__login">
            <label>
              Host / IP Address:
              <input
                type="text"
                value={creds.host}
                onChange={({ target }) =>
                  setCreds((c) => ({ ...c, host: target.value }))
                }
              />
            </label>
            <label>
              Username:
              <input
                type="text"
                value={creds.user}
                onChange={({ target }) =>
                  setCreds((c) => ({ ...c, user: target.value }))
                }
              />
            </label>
            <label>
              Password:
              <input
                type="text"
                value={creds.password}
                onChange={({ target }) =>
                  setCreds((c) => ({ ...c, password: target.value }))
                }
              />
            </label>
            <button onClick={connect}>{"Connect"}</button>
          </div>
        )}
      </div>
      {/* list of saves */}
      <ChannelLog />
    </div>
  )
}

type SaveStatusProps = {
  path?: string
}

const SaveStatus = ({ path }: SaveStatusProps) => {
  const info = useMemo(() => {
    if (!path) return null
    const split = splitAsPath(path)
    const platform = split.at(0)
    const file = split.at(-1)

    return { platform, file }
  }, [path])

  const [misterSaveInfo, setMisterSaveInfo] = useState<null | any>(null)

  useEffect(() => {
    if (!info) return
    const { platform, file } = info
    emit("mister-save-sync-find-save", { file, platform })
  }, [info])

  useEffect(() => {
    const unlisten = listen<string>(
      "mister-save-sync-found-save",
      ({ payload }) => {
        console.log({ payload })
      }
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  if (!info) return null

  const { platform, file } = info

  return (
    <div className="mister-sync__status">
      <div>
        Pocket
        <div>{file}</div>
        <div>{platform}</div>
      </div>
      <div>Equals</div>
      <div>MiSTer</div>
    </div>
  )
}

const ChannelLog = () => {
  const [logMessages, setLogMessages] = useState<string[]>([])

  useEffect(() => {
    const unlisten = listen<string>("mister-save-sync-log", ({ payload }) => {
      setLogMessages((log) => [payload, ...log])
    })
    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  return (
    <div className="mister-sync__log">
      {logMessages.map((s, index) => (
        <div key={index}>{s}</div>
      ))}
    </div>
  )
}

type SavesListProps = {
  onSelect: (save: string) => void
}

const SavesList = ({ onSelect }: SavesListProps) => {
  const allSaves = useRecoilValue(AllSavesSelector)

  return (
    <div className="mister-sync__saves-list">
      {allSaves.map((s) => (
        <div
          className="mister-sync__saves-list-item"
          key={s}
          onClick={() => onSelect(s)}
        >
          {s}
        </div>
      ))}
    </div>
  )
}
