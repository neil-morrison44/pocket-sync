import { listen } from "@tauri-apps/api/event"
import { useEffect, useState } from "react"
import { useRecoilValue } from "recoil"
import { instancePackagerCoresListSelector } from "../../../recoil/games/selectors"
import { invokeRunPackagerForCore } from "../../../utils/invokes"
import { Modal } from "../../modal"
import { CoreTag } from "../../shared/coreTag"

import "./index.css"

type BinCueJsonModalProp = {
  onClose: () => void
}

const MAX_BIN_FILES = 31

export const InstanceJson = ({ onClose }: BinCueJsonModalProp) => {
  // const cueFiles = useRecoilValue(cueFilesSelector)
  const [buildInProgress, setBuildInProgress] = useState(false)
  const coresList = useRecoilValue(instancePackagerCoresListSelector)
  const buildLog = useBuildLog()

  return (
    <Modal className="instance-json">
      <h2>Build Instance JSON files</h2>
      <div className="instance-json--top-content">
        <div>Automatic instance.json file creation available for:</div>
        <div className="instance-json__cores-list">
          {coresList.map((f) => (
            <CoreTag
              key={f}
              coreName={f}
              onClick={() => {
                invokeRunPackagerForCore(f)
              }}
            />
          ))}
        </div>
      </div>

      {buildLog.length > 0 && (
        <div className="instance-json__build-log">
          {buildLog.map(({ file_name, success, message }) => {
            if (success) {
              return (
                <div className="instance-json__build-log-item">{`Wrote ${file_name}`}</div>
              )
            }
            return (
              <div className="instance-json__build-log-item instance-json__build-log-item--warn">{`Skipped ${file_name} \n ${message}`}</div>
            )
          })}
        </div>
      )}
      <button onClick={onClose}>Close</button>
    </Modal>
  )
}

const useBuildLog = () => {
  const [buildLog, setBuildLog] = useState<InstanceBuildEventPlayload[]>([])

  useEffect(() => {
    const unlisten = listen<InstanceBuildEventPlayload>(
      "instance-packager-event-payload",
      ({ payload }) => setBuildLog((bl) => [...bl, payload])
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  return buildLog
}

type InstanceBuildEventPlayload = {
  file_name: string
  success: boolean
  message?: string
}
