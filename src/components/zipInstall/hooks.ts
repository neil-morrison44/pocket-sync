import { emit, listen } from "@tauri-apps/api/event"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useInvalidateFileSystem } from "../../hooks/invalidation"
import { filterKnownBadFiles } from "../../utils/filterFiles"
import { FileTreeNode, InstallZipEventPayload } from "./types"

export const useListenForZipInstall = () => {
  const [installState, setInstallState] =
    useState<null | InstallZipEventPayload>(null)

  const invalidateFS = useInvalidateFileSystem()

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
        setInstallState(null)
        invalidateFS()
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
  }, [files])
}

export const useAllowedFiles = (files: InstallZipEventPayload["files"]) => {
  const [allowedFiles, setAllowedFiles] = useState<string[] | null>(null)

  useEffect(() => {
    setAllowedFiles((f) => {
      if (f === null && files)
        return filterKnownBadFiles(files.map(({ path }) => path))
      return f
    })
  }, [files])

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

  return { allowedFiles, toggleFile }
}

export const useZipInstallButtons = (allowedFiles: string[] | null) => {
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

  return { confirm, cancel }
}
