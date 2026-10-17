import { useCallback, useMemo, useState } from "react"

import { pocketPathAtom } from "../../../jotai/atoms"
import { CleanableFilesSelectorFamily } from "../../../jotai/selectors"
import { invokeDeleteFiles } from "../../../utils/invokes"
import Button from "../../ui/Button"
import Callout from "../../ui/Callout"
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
      className="modal--form clean-files"
      title={t("title")}
      onClose={deleteInprogress ? undefined : onClose}
    >
      <p className="clean-files__intro">{t("intro")}</p>

      {files.length === 0 ? (
        <Callout>{t("none_found")}</Callout>
      ) : (
        <>
          <p className="clean-files__count">
            {t("files_found", { count: files.length })}
          </p>
          <ul className="clean-files__list">
            {files.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </>
      )}

      <div className="modal__actions">
        <Button theme="tertiary" disabled={deleteInprogress} onClick={onClose}>
          {t("close_button")}
        </Button>
        {files.length > 0 && (
          <Button
            theme="destructive"
            icon="trash"
            disabled={deleteInprogress}
            onClick={deleteFiles}
          >
            {deleteInprogress
              ? t("deleting")
              : t("delete_files_button", { count: files.length })}
          </Button>
        )}
      </div>
    </Modal>
  )
}

/** Opens right away with a loader while its data loads. */
export const CleanFilesModal = (props: CleanFilesModalProp) => {
  const { t } = useTranslation("clean_files")
  return (
    <ModalSuspense
      className="modal--form clean-files"
      title={t("title")}
      onClose={props.onClose}
    >
      <CleanFilesModalContent {...props} />
    </ModalSuspense>
  )
}
