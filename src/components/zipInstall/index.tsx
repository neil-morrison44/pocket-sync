import { Modal } from "../modal"
import {
  useAllowedFiles,
  useListenForDownloadProgress,
  useListenForZipInstall,
  useTree,
  useZipInstallButtons,
} from "./hooks"
import { TreeNode } from "./treeNode"
import { InstallZipEventPayload, ZipReplaceRequestPayload } from "./types"
import { Progress } from "../progress"
import "./index.css"
import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import { emit, listen } from "@tauri-apps/api/event"
import { confirm as TauriConfirm } from "@tauri-apps/plugin-dialog"

export const ZipInstall = () => {
  const { installState } = useListenForZipInstall()
  const { isDownloading, downloadProgress } = useListenForDownloadProgress()

  if (isDownloading && downloadProgress)
    return <ModalProgressBar {...downloadProgress} />

  if (!installState) return null
  return <ZipInstallInner {...installState} />
}

const ModalProgressBar = ({
  url,
  totalSize,
  downloaded,
}: {
  url: string
  totalSize: number
  downloaded: number
}) => (
  <Modal className="zip-install__progress-modal">
    <label htmlFor="download" className="zip-install__progress-bar-label">
      {url}
    </label>
    <progress
      id="download"
      className="zip-install__progress-bar"
      max={totalSize}
      value={downloaded}
    ></progress>
  </Modal>
)

const ZipInstallInner = ({
  files,
  progress,
  title,
}: InstallZipEventPayload) => {
  const tree = useTree(files)
  const { allowedFiles, toggleFile, toggleDir } = useAllowedFiles(files)
  const { confirm, cancel, handleMovedFiles, setHandleMovedFiles } =
    useZipInstallButtons(allowedFiles)

  const { t } = useTranslation("zip_install")

  useEffect(() => {
    const unlisten = listen<ZipReplaceRequestPayload>(
      "replace-confirm-request",
      async ({ payload }) => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        const allow = await TauriConfirm(
          t("replace.text", { list: payload.previous_core_names.join(",\n") }),
          {
            kind: "warning",
            title: t("replace.title"),
            cancelLabel: t("replace.cancel"),
            okLabel: t("replace.ok"),
          }
        )

        emit("replace-confirm-response", {
          type: "ReplaceConfirmation",
          allow,
        })
      }
    )

    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  if (progress) {
    return (
      <Modal>
        <h2>{title}</h2>
        <Progress percent={(progress.value / progress.max) * 100} />
      </Modal>
    )
  }

  return (
    <Modal>
      <h2 className="zip-install__title">{title}</h2>
      <div className="zip-install__paths">
        {!tree && <p>{t("scanning")}</p>}
        {tree &&
          allowedFiles &&
          tree.map((node) => (
            <TreeNode
              key={node.full}
              node={node}
              allowed={allowedFiles}
              defaultExpanded
              toggleFile={toggleFile}
              toggleDir={toggleDir}
            />
          ))}
      </div>

      <div className="zip-install__controls">
        <button onClick={cancel}>{t("cancel_button")}</button>
        <label
          className="zip-install__control-checkbox"
          title={t("moved_files_info")}
        >
          <input
            type="checkbox"
            checked={handleMovedFiles}
            onChange={({ target }) => setHandleMovedFiles(target.checked)}
          />
          {t("remove_duplicate")}
        </label>
        <button onClick={confirm}>{t("confirm_button")}</button>
      </div>
    </Modal>
  )
}
