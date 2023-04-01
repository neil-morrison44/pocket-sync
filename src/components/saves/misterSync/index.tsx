import { emit, listen } from "@tauri-apps/api/event"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { useBEM } from "../../../hooks/useBEM"
import { AllSavesSelector } from "../../../recoil/saves/selectors"
import { invokeBeginMisterSaveSyncSession } from "../../../utils/invokes"
import { splitAsPath } from "../../../utils/splitAsPath"
import { Controls } from "../../controls"
import { Loader } from "../../loader"

import "./index.css"
import { MiSTerSaveInfoSelectorFamily } from "./recoil/selectors"

type MisterSyncProps = {
  onClose: () => void
}

export const MisterSync = ({ onClose }: MisterSyncProps) => {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [selectedSave, setSelectedSave] = useState<string | null>(null)
  const [creds, setCreds] = useState({
    host: "mister.home.neil.today",
    user: "root",
    password: "1",
  })

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

  useEffect(() => {
    return () => {
      if (connected) emit("mister-save-sync-end")
    }
  }, [connected])

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
      <Suspense>
        <SaveStatus key={selectedSave} path={selectedSave || undefined} />
      </Suspense>
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
  const [equalityStatus, setEqualityStatus] = useState<
    "equals" | "unequal" | "to-pocket" | "to-mister"
  >("equals")

  const [platform, file] = useMemo(() => {
    if (!path) return []
    const split = splitAsPath(path)
    const platform = split.at(0)
    const file = split.at(-1)

    return [platform, file]
  }, [path])

  const misterSaveInfo = useRecoilValue(
    MiSTerSaveInfoSelectorFamily({ platform, file })
  )

  useEffect(() => {
    const t = window.setInterval(() => {
      setEqualityStatus(Math.random() > 0.5 ? "to-pocket" : "to-mister")
    }, 4000)

    return () => {
      window.clearInterval(t)
    }
  })

  const toPocketClassName = useBEM({
    block: "mister-sync",
    element: "status-to-pocket",
    modifiers: {
      equals: equalityStatus === "equals",
      progress: equalityStatus === "to-pocket",
    },
  })

  const toMisterClassName = useBEM({
    block: "mister-sync",
    element: "status-to-mister",
    modifiers: {
      equals: equalityStatus === "equals",
      progress: equalityStatus === "to-mister",
    },
  })

  if (!platform || !file) return null

  return (
    <div className="mister-sync__status">
      <div className="mister-sync__pocket">
        Pocket
        <div>{file}</div>
        <div>{platform}</div>
      </div>
      <div className="mister-sync__status-equals">
        <div className={toPocketClassName}></div>
        <div className={toMisterClassName}></div>
      </div>
      <div className="mister-sync__mister">
        MiSTer
        <div>{misterSaveInfo?.path}</div>
        <div>
          {misterSaveInfo?.timestamp &&
            new Date(misterSaveInfo.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  )
}

const ChannelLog = () => {
  const [logMessages, setLogMessages] = useState<string[]>([])

  useEffect(() => {
    const unlisten = listen<string>("mister-save-sync-log", ({ payload }) => {
      console.log({ payload })
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
