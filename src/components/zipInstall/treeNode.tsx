import { useState } from "react"
import { FileTreeNode } from "./types"

export const TreeNode = ({
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
