import { useState } from "react"
import { FileTreeNode } from "./types"
import Icon from "../ui/Icon"

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
          className="zip-install__tree-checkbox"
          aria-label={node.full}
          checked={
            allowed.includes(node.full) ||
            (node.is_dir && allowed.some((f) => f.startsWith(node.full)))
          }
          onChange={() => {
            node.is_dir ? toggleDir(node) : toggleFile(node.full)
          }}
        ></input>
        {/* Folders open and close; files are just their name */}
        {node.is_dir ? (
          <button
            type="button"
            className="zip-install__tree-node-name"
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
          >
            <Icon icon={expanded ? "chevron-down" : "chevron-right"} />
            {`${node.name}/`}
          </button>
        ) : (
          <span className="zip-install__tree-node-name zip-install__tree-node-name--file">
            {node.name}
          </span>
        )}
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
