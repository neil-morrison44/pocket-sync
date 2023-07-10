import { useCallback, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { useInvalidateFileSystem } from "../../../hooks/invalidation"
import { pocketPathAtom } from "../../../recoil/atoms"
import { CleanableFilesSelectorFamily } from "../../../recoil/selectors"
import { invokeDeleteFiles } from "../../../utils/invokes"
import { Loader } from "../../loader"
import { Modal } from "../../modal"

import "./index.css"
import { useTranslation } from "react-i18next"

type CleanFilesModalProp = {
  onClose: () => void
  path?: string
}

export const CleanFilesModal = ({
  onClose,
  path = "Assets",
}: CleanFilesModalProp) => {
  const cleanableFiles = useRecoilValue(CleanableFilesSelectorFamily(path))
  const [deleteInprogress, setDeleteInProgress] = useState(false)
  const invalidateFileSystem = useInvalidateFileSystem()
  const pocketPath = useRecoilValue(pocketPathAtom) as string
  const { t } = useTranslation("clean_files")

  const files = useMemo(() => {
    return cleanableFiles.map((f) => f.replace(`${pocketPath}/`, ""))
  }, [cleanableFiles, pocketPath])

  const deleteFiles = useCallback(async () => {
    setDeleteInProgress(true)
    await invokeDeleteFiles(files)
    invalidateFileSystem()
    setDeleteInProgress(false)
  }, [files, invalidateFileSystem])

  return (
    <Modal className="clean-files">
      <h2>{t("title")}</h2>
      <div>{t("files_found", { count: files.length })}</div>

      <div className="clean-files__list">
        {files.map((f) => (
          <div key={f}>{f}</div>
        ))}
      </div>

      {deleteInprogress && (
        <button>
          <Loader className="clean-files_button-loader" />
        </button>
      )}
      {!deleteInprogress && (
        <>
          <button onClick={deleteFiles}>{t("delete_files_button")}</button>
          <button onClick={onClose}>{t("close_button")}</button>
        </>
      )}
    </Modal>
  )
}
