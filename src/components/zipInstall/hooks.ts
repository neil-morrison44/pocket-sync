import { emit, listen } from "@tauri-apps/api/event"
import { useCallback, useEffect, useMemo, useState } from "react"
import { filterKnownBadFiles } from "../../utils/filterFiles"
import { FileTreeNode, InstallZipEventPayload } from "./types"
import { message } from "@tauri-apps/plugin-dialog"
import { useRecoilValue } from "recoil"
import { keepPlatformDataAtom } from "../../recoil/settings/atoms"

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
          })
        }

        treeNode = treeNode.find(({ name }) => name === element)?.children || []
      }

      return newTree
    }, [] as FileTreeNode[])
  }, [files])
}

export const useAllowedFiles = (files: InstallZipEventPayload["files"]) => {
  const [allowedFiles, setAllowedFiles] = useState<string[] | null>(null)
  const keepPlatformData = useRecoilValue(keepPlatformDataAtom)

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

  const toggleFile = useCallback(
    (path: string) => {
      setAllowedFiles((f) => {
        if (!f) return f

        if (f.includes(path)) {
          return f.filter((p) => p !== path)
        } else {
          return [...f, path]
        }
      })
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

  return { allowedFiles, toggleFile, toggleDir }
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
