import { listen } from "@tauri-apps/api/event"
import { useEffect, useState } from "react"

import "./index.css"
import { ProgressEvent } from "../../../types"
import { useRecoilValue_TRANSITION_SUPPORT_UNSTABLE } from "recoil"
import { pocketPathAtom } from "../../../recoil/atoms"
import { useProgress } from "../../../hooks/useProgress"

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}

type ProgressLoaderProps = {
  name: string
  showToken?: boolean
  hideUntilProgress?: boolean
}

export const ProgressLoader = ({
  name,
  showToken = false,
  hideUntilProgress = false,
}: ProgressLoaderProps) => {
  const { message, percent, inProgress } = useProgress(name)

  if (hideUntilProgress && !inProgress) return null

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
  const pocketPath = useRecoilValue_TRANSITION_SUPPORT_UNSTABLE(pocketPathAtom)
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
