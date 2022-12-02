import { useCallback, useEffect, useMemo, useState } from "react"
import { useRecoilValue } from "recoil"
import { useInvalidateFileSystem } from "../../../hooks/invalidation"
import { pocketPathAtom } from "../../../recoil/atoms"
import { CleanableFilesSelectorFamily } from "../../../recoil/selectors"
import {
  invokeDeleteFiles,
  invokeFindCleanableFiles,
} from "../../../utils/invokes"
import { Loader } from "../../loader"
import { Modal } from "../../modal"

import "./index.css"

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

  const files = useMemo(() => {
    return cleanableFiles.map((f) => f.replace(`${pocketPath}/`, ""))
  }, [cleanableFiles])

  const deleteFiles = useCallback(async () => {
    setDeleteInProgress(true)
    await invokeDeleteFiles(files)
    invalidateFileSystem()
    setDeleteInProgress(false)
  }, [files])

  return (
    <Modal className="clean-files">
      <h2>Clean Files</h2>
      <div>{`${files.length} cleanable file found`}</div>

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
          <button onClick={deleteFiles}>Delete Files</button>
          <button onClick={onClose}>Close</button>
        </>
      )}
    </Modal>
  )
}
