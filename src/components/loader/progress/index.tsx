import { listen } from "@tauri-apps/api/event"
import { useEffect, useState } from "react"

import "./index.css"
import { ProgressEvent } from "../../../types"
import { useRecoilValue } from "recoil"
import { pocketPathAtom } from "../../../recoil/atoms"

type ProgressLoaderProps = {
  name: string
}

export const ProgressLoader = ({ name }: ProgressLoaderProps) => {
  const [percent, setPercent] = useState(0)

  const [message, setMessage] = useState<null | {
    token: string
    param?: string
  }>(null)

  const pocketPath = useRecoilValue(pocketPathAtom)

  useEffect(() => {
    const unlisten = listen<ProgressEvent>(
      `progress-event::${name}`,
      ({ payload }) => {
        setPercent(payload.progress * 100)
        if (payload.message) setMessage(payload.message)
      }
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [setPercent, name])

  return (
    <div className="progress-loader">
      <div
        className="progress-loader__bar"
        style={{ "--percent": `${percent.toFixed(2)}%` }}
      ></div>
      {message && (
        <div className="progress-loader__info">
          <div className="progress-loader__info-token">{message.token}</div>
          {message.param && (
            <div className="progress-loader__info-param">
              {message.param?.replace(pocketPath || "", "").replace("//", "/")}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
