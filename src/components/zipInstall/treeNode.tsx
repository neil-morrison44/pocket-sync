import { useState } from "react"
import { FileTreeNode } from "./types"

export const TreeNode = ({
  node,
  allowed,
  defaultExpanded = false,
  toggleFile,
  toggleDir,
}: {
  node: FileTreeNode
  defaultExpanded?: boolean
  allowed: string[]
  toggleFile: (path: string) => void
  toggleDir: (node: FileTreeNode) => void
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className="zip-install__tree-node">
      <div className="zip-install__tree-node-info">
        <input
          type="checkbox"
          checked={
            allowed.includes(node.full) ||
            (node.is_dir && allowed.some((f) => f.startsWith(node.full)))
          }
          onChange={() => {
            node.is_dir ? toggleDir(node) : toggleFile(node.full)
          }}
        ></input>
        <div
          className="zip-install__tree-node-name"
          onClick={() => setExpanded((e) => !e)}
        >
          {node.is_dir && (
            <div
              className={`zip-install__tree-arrow zip-install__tree-arrow--${
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
            toggleDir={toggleDir}
          />
        ))}
    </div>
  )
}
