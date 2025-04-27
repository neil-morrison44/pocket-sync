import { emit, listen } from "@tauri-apps/api/event"
import {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
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
  MiSTerPlatformsForPocketPlatformSelectorFamily,
  MiSTerSaveInfoSelectorFamily,
} from "./recoil/selectors"
import { Tip } from "../../tip"
import { pocketPathAtom } from "../../../recoil/atoms"
import { MiSTerCredsAtom } from "./recoil/atoms"
import { useTranslation } from "react-i18next"
import { SaveMapping } from "./mapping"
import { ControlsBackButton } from "../../controls/inputs/backButton"
import { ControlsButton } from "../../controls/inputs/button"
import { ControlsSearch } from "../../controls/inputs/search"
import { useAtom, useAtomValue } from "jotai"
import { useAtomFnSet } from "../../../utils/jotai"

type MisterSyncProps = {
  onClose: () => void
}

export const MisterSync = ({ onClose }: MisterSyncProps) => {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [selectedSave, setSelectedSave] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [creds, setCreds] = useAtomFnSet(MiSTerCredsAtom)

  const { t } = useTranslation("mister_sync")

  const [saveMappingOpen, setSaveMappingOpen] = useState(false)

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
      if (connected) {
        emit("mister-save-sync-end")
      }
    }
  }, [connected])

  return (
    <div className="mister-sync">
      <Controls>
        <ControlsBackButton onClick={onClose}>
          {t("controls.back")}
        </ControlsBackButton>

        {connected && (
          <>
            <ControlsButton onClick={() => setSaveMappingOpen(true)}>
              {t("controls.save_mapping")}
            </ControlsButton>
            <ControlsSearch
              placeholder={t("controls.search")}
              value={query}
              onChange={setQuery}
            />
          </>
        )}
      </Controls>
      <Suspense>
        {saveMappingOpen && (
          <SaveMapping onClose={() => setSaveMappingOpen(false)} />
        )}
      </Suspense>
      <Suspense fallback={<div className="mister-sync__status" />}>
        {selectedSave && <SaveStatus key={selectedSave} path={selectedSave} />}
      </Suspense>
      <div className="mister-sync__content">
        {connected && (
          <Suspense>
            <SavesList onSelect={setSelectedSave} query={query} />
          </Suspense>
        )}
        {connecting && <Loader />}
        {!connected && !connecting && (
          <>
            <div className="mister-sync__login">
              <label>
                {t("login.host")}
                <input
                  type="text"
                  value={creds.host}
                  onChange={({ target }) =>
                    setCreds((c) => ({ ...c, host: target.value }))
                  }
                />
              </label>
              <label>
                {t("login.username")}
                <input
                  type="text"
                  value={creds.user}
                  onChange={({ target }) =>
                    setCreds((c) => ({ ...c, user: target.value }))
                  }
                />
              </label>
              <label>
                {t("login.password")}
                <input
                  type="text"
                  value={creds.password}
                  onChange={({ target }) =>
                    setCreds((c) => ({ ...c, password: target.value }))
                  }
                />
              </label>
              <button onClick={connect}>{t("login.connect")}</button>
            </div>
            <Tip>{t("tip_1")}</Tip>
            <Tip>{t("tip_2")}</Tip>
            <Tip>{t("tip_3")}</Tip>
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
  const [equalityStatus, setEqualityStatus] = useState<"equals" | "unequal">(
    "equals"
  )
  const { t } = useTranslation("mister_sync")

  const [platform, file] = useMemo(() => {
    const split = splitAsPath(path)
    const platform = split.at(0)
    const file = split.at(-1)
    return [platform, file]
  }, [path])

  const misterPlatforms = useAtomValue(
    MiSTerPlatformsForPocketPlatformSelectorFamily(platform)
  )

  const misterSaveInfo = useAtomValue(
    MiSTerSaveInfoSelectorFamily({ platforms: misterPlatforms, file })
  )
  const pocketSaveInfo = useAtomValue(
    FileMetadataSelectorFamily({ filePath: path })
  )

  const pocketPath = useAtomValue(pocketPathAtom)

  useEffect(() => {
    if (misterSaveInfo?.crc32 === pocketSaveInfo.crc32) {
      setEqualityStatus("equals")
    } else {
      setEqualityStatus("unequal")
    }
  }, [misterSaveInfo, pocketSaveInfo])

  const [selectedMisterPlatform, setSelectedMisterPlatform] = useState(
    misterPlatforms[0] ?? ""
  )

  const misterPath = useMemo<string | null>(() => {
    if (misterSaveInfo?.path) return misterSaveInfo.path
    if (misterPlatforms.length === 0) return null
    return `/media/fat/saves/${selectedMisterPlatform}/${file}`
  }, [
    file,
    misterPlatforms.length,
    misterSaveInfo?.path,
    selectedMisterPlatform,
  ])

  const moveSave = useCallback(
    (to: "pocket" | "mister") => {
      switch (to) {
        case "mister": {
          if (!misterPath) return
          emit("mister-save-sync-move-save-to-mister", {
            from: `${pocketPath}/Saves/${path}`,
            to: misterPath,
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
    [misterPath, pocketPath, path, misterSaveInfo?.path]
  )

  const toPocketClassName = useBEM({
    block: "mister-sync",
    element: "status-to-pocket",
    modifiers: {
      equals: equalityStatus === "equals",
    },
  })

  const toMisterClassName = useBEM({
    block: "mister-sync",
    element: "status-to-mister",
    modifiers: {
      equals: equalityStatus === "equals",
    },
  })

  return (
    <div className="mister-sync__status">
      <div className="mister-sync__pocket">
        <strong>{t("pocket")}</strong>
        <div>{path}</div>
        <div>{new Date(pocketSaveInfo.timestamp).toLocaleString()}</div>
        <div className="mister-sync__crc">
          {pocketSaveInfo.crc32.toString(16)}
        </div>
      </div>
      <div className="mister-sync__status-equals">
        {misterPath && (
          <>
            {misterSaveInfo?.crc32 && (
              <div
                className={toPocketClassName}
                onClick={() => moveSave("pocket")}
              ></div>
            )}
            <div
              className={toMisterClassName}
              onClick={() => moveSave("mister")}
            ></div>
          </>
        )}
      </div>

      <div className="mister-sync__mister">
        {misterPath && (
          <>
            <strong>{t("mister")}</strong>
            <div>{misterPath.replace("/media/fat/saves/", "")}</div>
            <div>
              {misterSaveInfo?.timestamp &&
                new Date(misterSaveInfo.timestamp).toLocaleString()}
            </div>
            <div className="mister-sync__crc">
              {misterSaveInfo?.crc32?.toString(16) || t("not_found")}
            </div>

            {misterPlatforms.length > 1 && !misterSaveInfo?.path && (
              <select
                value={selectedMisterPlatform}
                onChange={({ target }) =>
                  setSelectedMisterPlatform(target.value)
                }
              >
                {misterPlatforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
        {!misterPath && (
          <>
            <div style={{ whiteSpace: "pre-wrap" }}>
              {t("unsupported", { platform })}
            </div>
          </>
        )}
      </div>
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
  query: string
}

const SavesList = ({ onSelect, query }: SavesListProps) => {
  const allSaves = useAtomValue(AllSavesSelector)

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
