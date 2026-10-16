import { listen } from "@tauri-apps/api/event"
import { useEffect, useState } from "react"

import { instancePackagerCoresListSelector } from "../../../jotai/games/selectors"
import { invokeRunPackagerForCore } from "../../../utils/invokes"
import { Modal, ModalSuspense } from "../../modal"
import Button from "../../ui/Button"
import Callout from "../../ui/Callout"
import Icon from "../../ui/Icon"

import "./index.css"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"

type InstanceJsonProps = {
  onClose: () => void
  /**
   * Development only (Settings → Developer): made-up cores; Build adds
   * made-up written and skipped files to the log.
   */
  demo?: boolean
}

const RealInstanceJson = ({ onClose }: InstanceJsonProps) => (
  <InstanceJsonContent
    onClose={onClose}
    coresList={useAtomValue(instancePackagerCoresListSelector)}
    buildLog={useBuildLog()}
    onBuild={(core) => invokeRunPackagerForCore(core)}
  />
)

const DemoInstanceJson = ({ onClose }: InstanceJsonProps) => {
  const [buildLog, setBuildLog] = useState<InstanceBuildEventPlayload[]>([])
  return (
    <InstanceJsonContent
      onClose={onClose}
      coresList={["Mazamars312.NeoGeoCD", "Mazamars312.PC Engine CD"]}
      buildLog={buildLog}
      onBuild={(core) =>
        setBuildLog((log) => [
          ...log,
          { file_name: `${core}/Game One.json`, success: true },
          { file_name: `${core}/Game Two.json`, success: true },
          { file_name: `${core}/Broken Game.json`, success: false },
        ])
      }
    />
  )
}

const InstanceJsonContent = ({
  onClose,
  coresList,
  buildLog,
  onBuild,
}: InstanceJsonProps & {
  coresList: string[]
  buildLog: InstanceBuildEventPlayload[]
  onBuild: (core: string) => void
}) => {
  const { t } = useTranslation("instance_json")

  return (
    <Modal className="instance-json" title={t("title")} onClose={onClose}>
      <p className="instance-json__intro">{t("intro")}</p>

      {coresList.length === 0 ? (
        <Callout>{t("none_available")}</Callout>
      ) : (
        <ul className="instance-json__cores">
          {coresList.map((core) => (
            <li key={core} className="instance-json__core">
              <span className="instance-json__core-name">{core}</span>
              <Button icon="tools" onClick={() => onBuild(core)}>
                {t("build")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* What was written or skipped, as it happens */}
      {buildLog.length > 0 && (
        <ul className="instance-json__build-log" aria-live="polite">
          {buildLog.map(({ file_name, success }, index) => (
            <li
              key={`${index}-${file_name}`}
              className={`instance-json__build-log-item ${
                success ? "" : "instance-json__build-log-item--warn"
              }`}
            >
              <Icon icon={success ? "check" : "warning-diamond"} />
              {success
                ? t("wrote_file", { file_name })
                : t("skipped_file", { file_name })}
            </li>
          ))}
        </ul>
      )}

      <div className="modal__actions">
        <Button theme="tertiary" onClick={onClose}>
          {t("close_button")}
        </Button>
      </div>
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
      {props.demo ? (
        <DemoInstanceJson {...props} />
      ) : (
        <RealInstanceJson {...props} />
      )}
    </ModalSuspense>
  )
}
