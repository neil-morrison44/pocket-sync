import { Modal } from "../modal"
import {
  useAllowedFiles,
  useListenForZipInstall,
  useTree,
  useZipInstallButtons,
} from "./hooks"
import { TreeNode } from "./treeNode"
import { InstallZipEventPayload } from "./types"
import { Progress } from "../progress"
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
  const { allowedFiles, toggleFile, toggleDir } = useAllowedFiles(files)
  const { confirm, cancel, handleMovedFiles, setHandleMovedFiles } =
    useZipInstallButtons(allowedFiles)

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
              toggleDir={toggleDir}
            />
          ))}
      </div>

      <div className="zip-install__controls">
        <button onClick={cancel}>Cancel</button>
        <label
          className="zip-install__control-checkbox"
          title="Handles cases where files have moved, e.g. JSON files are now in `_alternatives`"
        >
          <input
            type="checkbox"
            checked={handleMovedFiles}
            onChange={({ target }) => setHandleMovedFiles(target.checked)}
          />
          Remove duplicate existing files
        </label>
        <button onClick={confirm}>Confirm</button>
      </div>
    </Modal>
  )
}
