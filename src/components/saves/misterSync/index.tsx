import { emit, listen } from "@tauri-apps/api/event"
import {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRecoilValue } from "recoil"
import { useBEM } from "../../../hooks/useBEM"
import { AllSavesSelector } from "../../../recoil/saves/selectors"
import { invokeBeginMisterSaveSyncSession } from "../../../utils/invokes"
import { splitAsPath } from "../../../utils/splitAsPath"
import { Controls } from "../../controls"
import { Loader } from "../../loader"
import { PlatformLabel } from "../info/platformLabel"
import { search } from "fast-fuzzy"

import "./index.css"
import {
  FileMetadataSelectorFamily,
  MiSTerSaveInfoSelectorFamily,
} from "./recoil/selectors"
import { Tip } from "../../tip"
import { pocketPathAtom } from "../../../recoil/atoms"

type MisterSyncProps = {
  onClose: () => void
}

export const MisterSync = ({ onClose }: MisterSyncProps) => {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [selectedSave, setSelectedSave] = useState<string | null>(null)

  const [query, setQuery] = useState("")
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
    if (connected) {
      const i = window.setInterval(() => {
        emit("mister-save-sync-heartbeat")
      }, 10 * 1000)

      return () => {
        clearInterval(i)
      }
    }
  }, [connected])

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
          connected && {
            type: "search",
            text: "Search Saves",
            value: query,
            onChange: (val) => setQuery(val),
          },
        ]}
      />
      <Suspense fallback={<div className="mister-sync__status" />}>
        {selectedSave && <SaveStatus key={selectedSave} path={selectedSave} />}
      </Suspense>
      <div className="mister-sync__content">
        {connected && <SavesList onSelect={setSelectedSave} query={query} />}
        {connecting && <Loader />}
        {!connected && !connecting && (
          <>
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
            <Tip>The MiSTer's FTP must be turned on</Tip>
            <Tip>
              Make sure the save is compatible between Pocket & MiSTer before
              transfer
            </Tip>
            <Tip>
              The Game must be named exactly the same on the Pocket and the
              MiSTer for the save to be found
            </Tip>
          </>
        )}
      </div>
      <ChannelLog />
    </div>
  )
}

type SaveStatusProps = {
  path: string
}

const SaveStatus = ({ path }: SaveStatusProps) => {
  const [equalityStatus, setEqualityStatus] = useState<
    "equals" | "unequal" | "to-pocket" | "to-mister"
  >("equals")

  const [platform, file] = useMemo(() => {
    const split = splitAsPath(path)
    const platform = split.at(0)
    const file = split.at(-1)
    return [platform, file]
  }, [path])

  const misterSaveInfo = useRecoilValue(
    MiSTerSaveInfoSelectorFamily({ platform, file })
  )
  const pocketSaveInfo = useRecoilValue(
    FileMetadataSelectorFamily({ filePath: path })
  )

  const pocketPath = useRecoilValue(pocketPathAtom)

  useEffect(() => {
    if (misterSaveInfo?.crc32 === pocketSaveInfo.crc32) {
      setEqualityStatus("equals")
    } else {
      setEqualityStatus("unequal")
    }
  }, [misterSaveInfo, pocketSaveInfo])

  const moveSave = useCallback(
    (to: "pocket" | "mister") => {
      setEqualityStatus(`to-${to}`)

      switch (to) {
        case "mister": {
          emit("mister-save-sync-move-save-to-mister", {
            from: `${pocketPath}/Saves/${path}`,
            to: misterSaveInfo?.path || "",
          })
          break
        }
        case "pocket": {
          emit("mister-save-sync-move-save-to-pocket", {
            to: `${pocketPath}/Saves/${path}`,
            from: misterSaveInfo?.path || "",
          })
          break
        }
      }
    },
    [path, misterSaveInfo, pocketSaveInfo]
  )

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

  return (
    <div className="mister-sync__status">
      <div className="mister-sync__pocket">
        <strong>Pocket</strong>
        <div>{path}</div>
        <div>{new Date(pocketSaveInfo.timestamp).toLocaleString()}</div>
        <div>{pocketSaveInfo.crc32.toString(16)}</div>
      </div>
      <div className="mister-sync__status-equals">
        <div
          className={toPocketClassName}
          onClick={() => moveSave("pocket")}
        ></div>
        <div
          className={toMisterClassName}
          onClick={() => moveSave("mister")}
        ></div>
      </div>
      <div className="mister-sync__mister">
        <strong>MiSTer</strong>
        <div>{misterSaveInfo?.path.replace("/media/fat/saves/", "")}</div>
        <div>
          {misterSaveInfo?.timestamp &&
            new Date(misterSaveInfo.timestamp).toLocaleString()}
        </div>
        <div>{misterSaveInfo?.crc32.toString(16)}</div>
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
  query: string
}

const SavesList = ({ onSelect, query }: SavesListProps) => {
  const allSaves = useRecoilValue(AllSavesSelector)

  const filteredSaves = useMemo(() => {
    if (query.length === 0) return allSaves
    return search(query, allSaves)
  }, [allSaves, query])

  const savesByPlatform = useMemo(() => {
    return filteredSaves.reduce((acc, curr) => {
      const split = splitAsPath(curr)
      const platform = split.at(0) || "unknown"
      if (!acc[platform]) acc[platform] = []
      acc[platform].push(curr)
      return acc
    }, {} as Record<string, string[]>)
  }, [filteredSaves])

  console.log({ savesByPlatform })

  return (
    <div className="mister-sync__saves-list">
      {Object.entries(savesByPlatform).map(([platformId, saves]) => (
        <Fragment key={platformId}>
          <PlatformLabel id={platformId} />
          <div className="mister-sync__saves-list-group">
            {saves.map((s) => (
              <div
                className="mister-sync__saves-list-item"
                key={s}
                onClick={() => onSelect(s)}
              >
                {s}
              </div>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  )
}
