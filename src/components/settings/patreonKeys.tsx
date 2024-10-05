import { listen } from "@tauri-apps/api/event"
import { useBEM } from "../../hooks/useBEM"
import { Link } from "../link"
import { ReactElement, useEffect, useState } from "react"
import { useRecoilValue } from "recoil"
import { patreonKeyListSelector } from "../../recoil/settings/selectors"
import { PatreonKeyInfo } from "../../types"

export const PatreonKeys = () => {
  const patreonUrls = useRecoilValue(patreonKeyListSelector)

  return (
    <div className="settings__patreon-keys-list">
      {patreonUrls.map((info) => (
        <PatreonKeysItem key={info.id} info={info} />
      ))}
    </div>
  )
}

type PatreonKeyEventState =
  | "InProgress"
  | "Valid"
  | "Invalid"
  | { downloading: number }

const PatreonKeysItem = ({ info }: { info: PatreonKeyInfo }): ReactElement => {
  const { name, logo, link, id } = info

  const [patreonState, setPatreonState] = useState<PatreonKeyEventState | null>(
    null
  )

  const className = useBEM({
    block: "settings",
    element: "patreon-keys-list-item",
    modifiers: {
      downloading: typeof patreonState === "object",
      valid: patreonState === "Valid",
      invalid: patreonState === "Invalid",
      "in-progress": patreonState === "InProgress",
    },
  })

  useEffect(() => {
    const unlisten = listen<PatreonKeyEventState>(
      `patreon_keys:${id}`,
      ({ payload }) => {
        setPatreonState(payload)
      }
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [setPatreonState])

  const downloadPercent =
    typeof patreonState === "object" ? patreonState?.downloading : 0

  return (
    <Link
      className={className}
      key={name}
      href={link}
      style={{ "--download-percent": `${downloadPercent}` }}
      title={name}
    >
      <img src={logo} title={name} width="55" height="55"></img>
    </Link>
  )
}
