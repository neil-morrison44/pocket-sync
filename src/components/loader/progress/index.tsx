import { listen } from "@tauri-apps/api/event"
import { useEffect, useState } from "react"

import "./index.css"
import { ProgressEvent } from "../../../types"
import { useRecoilValue } from "recoil"
import { pocketPathAtom } from "../../../recoil/atoms"

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}

type ProgressLoaderProps = {
  name: string
  showToken?: boolean
}

export const ProgressLoader = ({
  name,
  showToken = false,
}: ProgressLoaderProps) => {
  const [percent, setPercent] = useState(0)

  const [message, setMessage] = useState<null | {
    token: string
    param?: string
  }>(null)

  useEffect(() => {
    const unlisten = listen<ProgressEvent>(
      `progress-event::${name}`,
      ({ payload }) => {
        console.log({ payload })
        setPercent(payload.progress * 100)
        if (payload.message) setMessage(payload.message)
      }
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [setPercent, name])

  return (
    <ProgressLoaderInner
      percent={percent}
      message={message}
      showToken={showToken}
    />
  )
}

export const ProgressLoaderInner = ({
  percent,
  message,
  showToken,
}: {
  percent: number
  message: null | {
    token: string
    param?: string
  }
  showToken: boolean
}) => {
  const pocketPath = useRecoilValue(pocketPathAtom)
  return (
    <div className="progress-loader">
      <div
        className="progress-loader__bar"
        style={{ "--percent": `${percent.toFixed(2)}%` }}
      ></div>
      {message && (
        <div className="progress-loader__info">
          {showToken && (
            <div className="progress-loader__info-token">{message.token}</div>
          )}
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
