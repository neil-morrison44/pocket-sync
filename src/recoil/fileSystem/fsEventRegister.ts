import { listen } from "@tauri-apps/api/event"
import { FSEvent } from "../../types"

class FSEventRegister {
  fileRegistry: Record<string, (() => void)[]> = {}
  folderRegistry: Record<string, (() => void)[]> = {}
  callbackTree: TreeNode = { name: "/", children: [], callbacks: [] }

  constructor() {
    this.startListening()
  }

  startListening() {
    const unlisten = listen<FSEvent[]>("pocket-fs-event", ({ payload }) => {
      // console.log({ payload })
      const changedPaths = payload.flatMap(({ paths }) => paths)

      console.log(this.callbackTree)

      const changedNodes = changedPaths
        .map((changedPath) => {
          const node = this.findOrCreateOnCallbackTree(
            changedPath.replace("/Users/neilmorrison/Desktop/pocket_full/", "")
          )

          return node
        })
        .filter((node, index, arr) => arr.indexOf(node) === index)
        .forEach((node) => {
          console.log({ node })
          this.callAllCallbacksUnder(node)
        })
    })
  }

  registerFile(path: string, callback: () => void) {
    const node = this.findOrCreateOnCallbackTree(path)
    node.callbacks.push(callback)
  }

  registerFolder(path: string, callback: () => void) {
    const node = this.findOrCreateOnCallbackTree(path)
    node.callbacks.push(callback)
  }

  findOrCreateOnCallbackTree(path: string): TreeNode {
    const folders = path.split("/")
    let currentTreeNode = this.callbackTree
    while (folders.length > 0) {
      const folder = folders.shift()
      if (!folder) throw new Error("folder too far")
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
        }
        currentTreeNode.children.push(newNode)
        currentTreeNode = newNode
        continue
      }
    }
    return currentTreeNode
  }

  callAllCallbacksUnder(node: TreeNode) {
    node.callbacks.forEach((c) => c())
    node.children.forEach((child) => this.callAllCallbacksUnder(child))
  }
}

let activeRegistry: null | FSEventRegister = null

export const registerFilePath = (path: string, callback: () => void) => {
  if (!activeRegistry) activeRegistry = new FSEventRegister()
  activeRegistry.registerFile(path, callback)
}

export const registerFolderPath = (path: string, callback: () => void) => {
  if (!activeRegistry) activeRegistry = new FSEventRegister()
  activeRegistry.registerFolder(path, callback)
}

type TreeNode = {
  name: string
  children: TreeNode[]
  callbacks: (() => void)[]
}
