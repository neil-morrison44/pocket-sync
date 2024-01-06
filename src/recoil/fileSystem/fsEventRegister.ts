import { listen } from "@tauri-apps/api/event"
import { FSEvent } from "../../types"
import { splitAsPath } from "../../utils/splitAsPath"
import { sep } from "@tauri-apps/api/path"

let previousPocketPath: string | null = null

class FSEventRegister {
  fileRegistry: Record<string, (() => void)[]> = {}
  folderRegistry: Record<string, (() => void)[]> = {}
  callbackTree: TreeNode = {
    name: "/",
    children: [],
    callbacks: [],
    parent: null,
  }
  debug: boolean = false

  constructor() {
    this.startListening()
  }

  startListening() {
    const unlisten = listen<{ events: FSEvent[]; pocket_path: string }>(
      "pocket-fs-event",
      ({ payload }) => {
        if (this.debug) console.count("fs-event")
        const { events, pocket_path: pocketPath } = payload
        const calledAlready = new Set<TreeNode>()

        const unmountEvent = events.find(
          // @ts-ignore
          (e) => e.paths.includes(pocketPath) && e.type.remove !== undefined
        )
        if (unmountEvent) {
          this.callAllCallbacksUnder(this.callbackTree, calledAlready)
          return
        }
        const changedPaths = events.flatMap(({ paths, type }) => {
          // @ts-ignore Not sure why TS can't handle this
          const innerChange = type.modify && type.modify.kind !== "rename"

          return paths.map((path) => ({
            path,
            innerChange,
          }))
        })

        if (previousPocketPath && previousPocketPath !== pocketPath) {
          this.callAllCallbacksUnder(this.callbackTree, calledAlready)
          previousPocketPath = pocketPath
          return
        }
        previousPocketPath = pocketPath

        changedPaths
          .map(({ path, innerChange }) => {
            const node = this.findOrCreateOnCallbackTree(
              path
                .replace(`${pocketPath}${sep}`, "")
                .replace(`${pocketPath}`, "")
            )

            return { path, node, innerChange }
          })
          .filter(
            ({ node }, index, arr) =>
              arr.findIndex(({ node: n }) => node === n) === index
          )
          .forEach(({ path, node, innerChange }) => {
            if (this.debug) console.log({ path, node, innerChange })
            if (innerChange) {
              node.callbacks.forEach((c) => c())
              calledAlready.add(node)
            } else {
              this.callAllCallbacksAbove(node, calledAlready)
            }
          })
      }
    )
  }

  registerFile(path: string, callback: () => void) {
    const node = this.findOrCreateOnCallbackTree(path)
    node.callbacks.push(callback)
  }

  unregisterFile(path: string, callback: () => void) {
    const node = this.findOrCreateOnCallbackTree(path)
    node.callbacks = node.callbacks.filter((c) => c !== callback)
  }

  registerFolder(path: string, callback: () => void) {
    const node = this.findOrCreateOnCallbackTree(path)
    node.callbacks.push(callback)
  }

  unregisterFolder(path: string, callback: () => void) {
    const node = this.findOrCreateOnCallbackTree(path)
    node.callbacks = node.callbacks.filter((c) => c !== callback)
  }

  findOrCreateOnCallbackTree(path: string): TreeNode {
    if (path === "/") return this.callbackTree

    const folders = splitAsPath(path)
    let currentTreeNode = this.callbackTree
    while (folders.length > 0) {
      const folder = folders.shift()
      if (!folder) throw new Error(`folder too far: ${path}`)
      const existingNode = currentTreeNode.children.find(
        ({ name }) => name === folder
      )
      if (existingNode) {
        currentTreeNode = existingNode
      } else {
        const newNode = {
          name: folder,
          callbacks: [],
          children: [],
          parent: currentTreeNode,
        }
        currentTreeNode.children.push(newNode)
        currentTreeNode = newNode
        continue
      }
    }
    return currentTreeNode
  }

  callAllCallbacksAbove(node: TreeNode, calledAlready: Set<TreeNode>) {
    if (calledAlready.has(node)) return
    if (this.debug) console.log("callAllCallbacksAbove: for", node)
    node.callbacks.forEach((c) => c())
    calledAlready.add(node)
    if (node.parent) this.callAllCallbacksAbove(node.parent, calledAlready)
    // node.children.forEach((child) => this.callAllCallbacksUnder(child))
  }

  callAllCallbacksUnder(node: TreeNode, calledAlready: Set<TreeNode>) {
    if (calledAlready.has(node)) return
    if (this.debug) console.log("callAllCallbacksUnder: for", node)
    node.callbacks.forEach((c) => c())
    calledAlready.add(node)
    node.children.forEach((child) =>
      this.callAllCallbacksUnder(child, calledAlready)
    )
  }

  callAllFolderCallbacks(node: TreeNode, calledAlready: Set<TreeNode>) {
    if (calledAlready.has(node)) return
    if (this.debug) console.log("callAllFolderCallbacks: for", node)
    node.callbacks.forEach((c) => c())
    calledAlready.add(node)
    node.children
      .filter((child) => child.children.length > 0)
      .forEach((child) => this.callAllFolderCallbacks(child, calledAlready))
  }
}

let activeRegistry: null | FSEventRegister = null

export const registerFilePath = (path: string, callback: () => void) => {
  if (!activeRegistry) activeRegistry = new FSEventRegister()
  activeRegistry.registerFile(path, callback)

  return () => activeRegistry?.unregisterFile(path, callback)
}

export const registerFolderPath = (path: string, callback: () => void) => {
  if (!activeRegistry) activeRegistry = new FSEventRegister()
  activeRegistry.registerFolder(path, callback)

  return () => activeRegistry?.unregisterFile(path, callback)
}

type TreeNode = {
  name: string
  children: TreeNode[]
  parent: TreeNode | null
  callbacks: (() => void)[]
}
