import { listen } from "@tauri-apps/api/event"
import { useEffect, useState } from "react"

import { instancePackagerCoresListSelector } from "../../../jotai/games/selectors"
import { invokeRunPackagerForCore } from "../../../utils/invokes"
import { Modal, ModalSuspense } from "../../modal"
import { CoreTag } from "../../shared/coreTag"

import "./index.css"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"

type InstanceJsonProps = {
  onClose: () => void
}

const InstanceJsonContent = ({ onClose }: InstanceJsonProps) => {
  const coresList = useAtomValue(instancePackagerCoresListSelector)
  const buildLog = useBuildLog()
  const { t } = useTranslation("instance_json")

  return (
    <Modal className="instance-json" title={t("title")} onClose={onClose}>
      <div className="instance-json--top-content">
        <div>{t("available_for")}</div>
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
          {buildLog.map(({ file_name, success }) => {
            if (success) {
              return (
                <div key={file_name} className="instance-json__build-log-item">
                  {t("wrote_file", { file_name })}
                </div>
              )
            }
            return (
              <div
                key={file_name}
                className="instance-json__build-log-item instance-json__build-log-item--warn"
              >
                {t("skipped_file", { file_name })}
              </div>
            )
          })}
        </div>
      )}
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

/** Opens right away with a loader while its data loads. */
export const InstanceJson = (props: InstanceJsonProps) => {
  const { t } = useTranslation("instance_json")
  return (
    <ModalSuspense
      className="instance-json"
      title={t("title")}
      onClose={props.onClose}
    >
      <InstanceJsonContent {...props} />
    </ModalSuspense>
  )
}
