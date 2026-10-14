import { useCallback, useMemo, useState } from "react"

import { pocketPathAtom } from "../../../jotai/atoms"
import { CleanableFilesSelectorFamily } from "../../../jotai/selectors"
import { invokeDeleteFiles } from "../../../utils/invokes"
import { Loader } from "../../loader"
import { Modal, ModalSuspense } from "../../modal"

import "./index.css"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"

type CleanFilesModalProp = {
  onClose: () => void
  path?: string
}

const CleanFilesModalContent = ({
  onClose,
  path = "Assets",
}: CleanFilesModalProp) => {
  const cleanableFiles = useAtomValue(CleanableFilesSelectorFamily(path))
  const [deleteInprogress, setDeleteInProgress] = useState(false)
  const pocketPath = useAtomValue(pocketPathAtom)
  const { t } = useTranslation("clean_files")

  const files = useMemo(() => {
    return cleanableFiles.map((f) => f.replace(`${pocketPath}/`, ""))
  }, [cleanableFiles, pocketPath])

  const deleteFiles = useCallback(async () => {
    setDeleteInProgress(true)
    await invokeDeleteFiles(files)
    setDeleteInProgress(false)
  }, [files])

  return (
    <Modal
      className="clean-files"
      title={t("title")}
      onClose={deleteInprogress ? undefined : onClose}
    >
      <div>{t("files_found", { count: files.length })}</div>

      <div className="clean-files__list">
        {files.map((f) => (
          <div key={f}>{f}</div>
        ))}
      </div>

      {deleteInprogress && (
        <button>
          <Loader className="clean-files_button-loader" size={20} />
        </button>
      )}
      {!deleteInprogress && (
        <>
          <button onClick={deleteFiles}>{t("delete_files_button")}</button>
        </>
      )}
    </Modal>
  )
}

/** Opens right away with a loader while its data loads. */
export const CleanFilesModal = (props: CleanFilesModalProp) => {
  const { t } = useTranslation("clean_files")
  return (
    <ModalSuspense
      className="clean-files"
      title={t("title")}
      onClose={props.onClose}
    >
      <CleanFilesModalContent {...props} />
    </ModalSuspense>
  )
}
