import { Modal } from "../modal"
import {
  useAllowedFiles,
  useListenForZipInstall,
  useTree,
  useZipInstallButtons,
} from "./hooks"
import { TreeNode } from "./treeNode"
import { InstallZipEventPayload } from "./types"

import "./index.css"

export const ZipInstall = () => {
  const { installState } = useListenForZipInstall()

  if (!installState) return null
  return <ZipInstallInner {...installState} />
}

export const ZipInstallInner = ({
  files,
  progress,
  title,
}: InstallZipEventPayload) => {
  const tree = useTree(files)
  const { allowedFiles, toggleFile } = useAllowedFiles(files)
  const { confirm, cancel } = useZipInstallButtons(allowedFiles)

  if (progress) {
    return (
      <Modal>
        <h2>{title}</h2>
        <>
          <h1>{`${((progress.value / progress.max) * 100).toFixed(0)}%`}</h1>
          <progress
            className="zip-install__progress"
            value={progress.value}
            max={progress.max}
          />
        </>
      </Modal>
    )
  }

  return (
    <Modal>
      <h2>{title}</h2>
      <div className="zip-install__paths">
        {!tree && <p>{`Scanning files...`}</p>}
        {tree &&
          allowedFiles &&
          tree.map((node) => (
            <TreeNode
              key={node.full}
              node={node}
              allowed={allowedFiles}
              defaultExpanded
              toggleFile={toggleFile}
            />
          ))}
      </div>

      <div className="zip-install__controls">
        <button onClick={cancel}>Cancel</button>
        <button onClick={confirm}>Confirm</button>
      </div>
    </Modal>
  )
}
