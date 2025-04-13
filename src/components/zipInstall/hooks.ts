import { emit, listen } from "@tauri-apps/api/event"
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { filterKnownBadFiles } from "../../utils/filterFiles"
import { FileTreeNode, InstallZipEventPayload } from "./types"
import { message } from "@tauri-apps/plugin-dialog"

import { keepPlatformDataAtom } from "../../recoil/settings/atoms"
import { useAtomValue } from "jotai"

export const useListenForZipInstall = () => {
  const [installState, setInstallState] =
    useState<null | InstallZipEventPayload>(null)

  useEffect(() => {
    const unlisten = listen<InstallZipEventPayload>(
      "install-zip-event",
      ({ payload }) => setInstallState(payload)
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [setInstallState])

  useEffect(() => {
    const unlisten = listen<{ error?: string }>(
      "install-zip-finished",
      ({ payload }) => {
        if (payload.error)
          message(payload.error, { title: "Error", kind: "error" })

        setInstallState(null)
      }
    )
    return () => {
      unlisten.then((l) => l())
    }
  }, [setInstallState])

  return { installState }
}

export const useTree = (files: InstallZipEventPayload["files"]) => {
  return useMemo<FileTreeNode[] | null>(() => {
    if (!files) return null

    const sortedFiles = [...files].sort(({ path: pathA }, { path: pathB }) =>
      pathA.localeCompare(pathB)
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
            full: fileBits.slice(0, index + 1).join("/"),
            exists: curr.exists,
            is_dir: index !== fileBits.length - 1,
            children: [],
            parent: null,
          })
        }

        treeNode = treeNode.find(({ name }) => name === element)?.children || []
      }

      const toBeParented = [...newTree]
      while (true) {
        const node = toBeParented.pop()
        if (!node) break
        node.children.forEach((child) => (child.parent = node))
        toBeParented.push(...node.children)
      }

      return newTree
    }, [] as FileTreeNode[])
  }, [files])
}

export const useAllowedFiles = (
  files: InstallZipEventPayload["files"],
  tree: FileTreeNode[] | null
) => {
  const [allowedFiles, setAllowedFiles] = useState<string[] | null>(null)
  const keepPlatformData = useAtomValue(keepPlatformDataAtom)
  const flattenedTree = useFlattenedTree(tree)

  useEffect(() => {
    setAllowedFiles((f) => {
      if (f === null && files) {
        const filePaths = files
          .filter(({ path, exists }) => {
            return !(
              path.startsWith("Platforms") &&
              keepPlatformData.enabled &&
              exists
            )
          })
          .map(({ path }) => path)

        return filterKnownBadFiles(filePaths)
      }
      return f
    })
  }, [files, keepPlatformData.enabled])

  const removeEmptyDirs = (allowed: string[]): string[] => {
    console.log({ flattenedTree })
    return allowed
      .map((path) => flattenedTree.find(({ full }) => path == full))
      .filter((n): n is FileTreeNode => n !== undefined)
      .filter(
        (n) => !n.is_dir || (n.is_dir && !hasAnyActiveChildren(n, allowed))
      )
      .map(({ full }) => full)
  }

  const hasAnyActiveChildren = (
    node: FileTreeNode,
    allowed: string[]
  ): boolean => {
    console.log(node, allowed)
    return (
      allowedFiles?.includes(node.full) ||
      node.children.some((c) => hasAnyActiveChildren(c, allowed))
    )
  }

  const toggleFile = useCallback(
    (path: string) => {
      startTransition(() =>
        setAllowedFiles((f) => {
          if (!f) return f

          if (f.includes(path)) {
            return removeEmptyDirs(f.filter((p) => p !== path))
          } else {
            return [...f, path]
          }
        })
      )
    },
    [setAllowedFiles, tree]
  )

  const toggleFiles = useCallback(
    (paths: string[]) => {
      startTransition(() =>
        setAllowedFiles((f) => {
          if (!f) return f
          const allAllowed = paths.every((path) => f.includes(path))

          if (allAllowed) {
            // remove them all

            console.log(
              f.filter((p) => !paths.includes(p)),
              removeEmptyDirs(f.filter((p) => !paths.includes(p)))
            )
            return removeEmptyDirs(f.filter((p) => !paths.includes(p)))
          } else {
            // Add them all
            return Array.from(new Set([...f, ...paths]))
          }
        })
      )
    },
    [setAllowedFiles]
  )

  const toggleDir = useCallback(
    (node: FileTreeNode) => {
      const underNodes: FileTreeNode[] = []

      const visit = (node: FileTreeNode) => {
        underNodes.push(node)
        if (node.is_dir) node.children.forEach(visit)
      }

      visit(node)

      setAllowedFiles((files) => {
        if (
          files?.includes(node.full) ||
          (node.is_dir && files?.some((f) => f.startsWith(node.full)))
        ) {
          return files?.filter((f) => !f.startsWith(node.full)) || null
        } else {
          return Array.from(
            new Set([
              ...(files ?? []),
              node.full,
              ...underNodes.map((n) => n.full),
            ])
          )
        }
      })
    },
    [setAllowedFiles]
  )

  return { allowedFiles, toggleFile, toggleDir, toggleFiles }
}

export const useZipInstallButtons = (allowedFiles: string[] | null) => {
  const [handleMovedFiles, setHandleMovedFiles] = useState(true)

  const confirm = useCallback(() => {
    emit("install-confirmation", {
      type: "InstallConfirmation",
      paths: allowedFiles,
      handle_moved_files: handleMovedFiles,
      allow: true,
    })
  }, [allowedFiles, handleMovedFiles])

  const cancel = useCallback(() => {
    emit("install-confirmation", {
      type: "InstallConfirmation",
      paths: [],
      handle_moved_files: false,
      allow: false,
    })
  }, [])

  return { confirm, cancel, handleMovedFiles, setHandleMovedFiles }
}

export const useListenForDownloadProgress = () => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [downloadProgress, setDownloadProgress] = useState<null | {
    url: string
    totalSize: number
    downloaded: number
  }>(null)

  ;("install-zip-download-progress")

  useEffect(() => {
    const unlisten = listen<{
      url: string
      total_size: number
      downloaded: number
    }>("install-zip-download-progress", ({ payload }) => {
      setIsDownloading(payload.downloaded !== payload.total_size)
      setDownloadProgress({ ...payload, totalSize: payload.total_size })
    })
    return () => {
      unlisten.then((l) => l())
    }
  }, [])

  return { isDownloading, downloadProgress }
}

export const useFlattenedTree = (tree: FileTreeNode[] | null) =>
  useMemo<FileTreeNode[]>(() => {
    if (!tree) return []
    const files: FileTreeNode[] = []
    const toBeProcessed = [...tree]

    while (toBeProcessed.length > 0) {
      const file = toBeProcessed.pop()
      if (!file) continue
      if (file.is_dir) {
        toBeProcessed.push(...file.children)
      } else {
        files.push(file)
      }
    }

    return files
  }, [tree])
