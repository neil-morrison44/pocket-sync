import { emit, listen } from "@tauri-apps/api/event"
import { useCallback, useEffect, useMemo, useState } from "react"
import { InstallDetails } from "../../../../types"

import "./index.css"

type InstallOptionsProps = {
  details: InstallDetails
}

export const InstallOptions = ({ details }: InstallOptionsProps) => {
  const [allowedFiles, setAllowedFiles] = useState<string[]>(
    details.files.map(({ path }) => path)
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
  }, [])

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
    <div className="install-options__wrapper">
      <div className="install-options">
        <h2>{"Install Core"}</h2>
        {!progress && (
          <div className="install-options__paths">
            {tree.map((node) => (
              <TreeNode node={node} allowed={allowedFiles} />
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
      </div>
    </div>
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
}: {
  node: FileTreeNode
  allowed: string[]
}) => {
  return (
    <div className="install-options__tree-node">
      <div className="install-options__tree-node-info">
        <input type="checkbox" checked={allowed.includes(node.full)}></input>
        {node.name}
        {node.is_dir ? "/" : ""}
      </div>

      {node.children.map((n) => (
        <TreeNode node={n} key={n.full} allowed={allowed} />
      ))}
    </div>
  )
}
