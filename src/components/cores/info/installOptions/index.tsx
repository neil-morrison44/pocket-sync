import { emit, listen } from "@tauri-apps/api/event"
import { useCallback, useEffect, useMemo, useState } from "react"
import { InstallDetails } from "../../../../types"
import { Modal } from "../../../modal"

import "./index.css"

type InstallOptionsProps = {
  details: InstallDetails
}

export const InstallOptions = ({ details }: InstallOptionsProps) => {
  const [allowedFiles, setAllowedFiles] = useState<string[]>(
    details.files.map(({ path }) => path)
  )

  const toggleFile = useCallback(
    (path: string) => {
      setAllowedFiles((f) => {
        if (f.includes(path)) {
          return f.filter((p) => p !== path)
        } else {
          return [...f, path]
        }
      })
    },
    [setAllowedFiles]
  )

  const [progress, setProgress] = useState<{
    max: number
    value: number
  } | null>(null)

  useEffect(() => {
    const unlisten = listen<{ max: number; value: number }>(
      "core-progress",
      ({ payload }) => {
        setProgress(payload)
      }
    )

    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  const confirm = useCallback(() => {
    emit("install-confirmation", {
      paths: allowedFiles,
      allow: true,
    })
  }, [allowedFiles])

  const cancel = useCallback(() => {
    emit("install-confirmation", {
      paths: [],
      allow: false,
    })
  }, [])

  const tree = useMemo<FileTreeNode[]>(() => {
    const sortedFiles = [...details.files].sort(
      ({ path: pathA }, { path: pathB }) => pathA.localeCompare(pathB)
    )

    return sortedFiles.reduce((prev, curr) => {
      const newTree: FileTreeNode[] = [...prev]
      const fileBits = curr.path.split("/")
      let treeNode = newTree

      for (let index = 0; index < fileBits.length; index++) {
        const element = fileBits[index]
        if (element === "") continue
        if (!treeNode.find(({ name }) => name === element)) {
          treeNode.push({
            name: element,
            full: curr.path,
            exists: curr.exists,
            is_dir: index !== fileBits.length - 1,
            children: [],
          })
        }

        treeNode = treeNode.find(({ name }) => name === element)?.children || []
      }

      return newTree
    }, [] as FileTreeNode[])
  }, [details.files])

  return (
    <Modal>
      <h2>{"Install Core"}</h2>
      {!progress && (
        <div className="install-options__paths">
          {tree.map((node) => (
            <TreeNode
              node={node}
              allowed={allowedFiles}
              defaultExpanded
              toggleFile={toggleFile}
            />
          ))}
        </div>
      )}

      {progress && (
        <>
          <h1>{`${((progress.value / progress.max) * 100).toFixed(0)}%`}</h1>
          <progress
            className="install-options__progress"
            value={progress.value}
            max={progress.max}
          />
        </>
      )}

      {!progress && (
        <div className="install-options__controls">
          <button onClick={cancel}>Cancel</button>
          <button onClick={confirm}>Confirm</button>
        </div>
      )}
    </Modal>
  )
}

type FileTreeNode = {
  name: string
  full: string
  exists: boolean
  is_dir: boolean
  children: FileTreeNode[]
}

const TreeNode = ({
  node,
  allowed,
  defaultExpanded = false,
  toggleFile,
}: {
  node: FileTreeNode
  defaultExpanded?: boolean
  allowed: string[]
  toggleFile: (path: string) => void
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="install-options__tree-node">
      <div className="install-options__tree-node-info">
        {!node.is_dir && (
          <input
            type="checkbox"
            checked={allowed.includes(node.full)}
            onChange={() => toggleFile(node.full)}
          ></input>
        )}
        <div
          className="install-options__tree-node-name"
          onClick={() => setExpanded((e) => !e)}
        >
          {node.is_dir && (
            <div
              className={`install-options__tree-arrow install-options__tree-arrow--${
                expanded ? "expanded" : "collapsed"
              }`}
            ></div>
          )}
          {node.name}
          {node.is_dir ? "/" : ""}
        </div>
      </div>

      {expanded &&
        node.children.map((n) => (
          <TreeNode
            node={n}
            key={n.full}
            allowed={allowed}
            toggleFile={toggleFile}
          />
        ))}
    </div>
  )
}
