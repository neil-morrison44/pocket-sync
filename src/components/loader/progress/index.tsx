import { listen } from "@tauri-apps/api/event"
import { useEffect, useState } from "react"

import ProgressBar from "../../ui/ProgressBar"

import "./index.css"
import { ProgressEvent } from "../../../types"

import { pocketPathAtom } from "../../../jotai/atoms"
import { useProgress } from "../../../hooks/useProgress"
import { useAtomValue } from "jotai"

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
  const pocketPath = useAtomValue(pocketPathAtom)
  const param = message?.param?.replace(pocketPath || "", "").replace("//", "/")
  return (
    <ProgressBar
      className="progress-loader"
      value={percent}
      label={
        message && (
          <>
            {showToken && message.token}
            {showToken && param && " "}
            {param}
          </>
        )
      }
    />
  )
}
