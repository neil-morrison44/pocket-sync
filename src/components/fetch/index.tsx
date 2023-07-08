import React, { ReactNode, Suspense, useMemo, useState } from "react"

import "./index.css"
import { useRecoilValue } from "recoil"
import {
  ArchiveMetadataSelectorFamily,
  PathFileInfoSelectorFamily,
} from "../../recoil/archive/selectors"
import { useInstallRequiredFiles } from "../../hooks/useInstallRequiredFiles"
import { Progress } from "../progress"
import { FileCopy, RequiredFileInfo } from "../../types"
import { Modal } from "../modal"
import { useInvalidateFileSystem } from "../../hooks/invalidation"
import { Controls } from "../controls"
import { PocketSyncConfigSelector } from "../../recoil/config/selectors"
import { NewFetch } from "./new"
import { invokeCopyFiles } from "../../utils/invokes"
import { pocketPathAtom } from "../../recoil/atoms"
import { comparePaths } from "../../utils/comparePaths"
import { splitAsPath } from "../../utils/splitAsPath"

type FileStatus = "complete" | "partial" | "none" | "waiting"

export const Fetch = () => {
  const config = useRecoilValue(PocketSyncConfigSelector)
  const [newFetchOpen, setNewFetchOpen] = useState<boolean>(false)
  const list = config.fetches || []

  return (
    <div className="fetch">
      <Controls
        controls={[
          {
            type: "button",
            text: "Add fetch location",
            onClick: () => setNewFetchOpen(true),
          },
        ]}
      />

      {newFetchOpen && <NewFetch onClose={() => setNewFetchOpen(false)} />}

      <div className="fetch__list">
        {list.map((item) => {
          switch (item.type) {
            case "archive.org":
              return <ArchiveOrgItem key={item.name} {...item} />
            case "filesystem":
              return (
                <FileSystemItem
                  key={`${item.path}->${item.destination}`}
                  {...item}
                />
              )
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}

const FileSystemItem = ({
  path,
  destination,
}: {
  path: string
  destination: string
}) => {
  const invalidateFileSystem = useInvalidateFileSystem()

  return (
    <div className="fetch__list-item">
      <div>
        <div className="fetch__list-item-type">Local Files</div>
        <div className="fetch__list-item-name">{path}</div>
        <div className="fetch__list-item-destination">{destination}</div>
      </div>

      <Suspense fallback={<FileStatus status="waiting" files={[]} />}>
        <FileSystemStatus path={path} destination={destination}>
          {(status, files) => (
            <>
              <FileStatus status={status} files={files} />

              <button
                onClick={async () => {
                  await invokeCopyFiles(files)
                  invalidateFileSystem()
                }}
              >
                Fetch
              </button>
            </>
          )}
        </FileSystemStatus>
      </Suspense>

      <button>Remove</button>
    </div>
  )
}

const FileSystemStatus = ({
  path,
  destination,
  children,
}: {
  path: string
  destination: string
  children: (status: FileStatus, files: FileCopy[]) => ReactNode
}) => {
  const pocketPath = useRecoilValue(pocketPathAtom)
  const pocketFileInfo = useRecoilValue(
    PathFileInfoSelectorFamily({ path: destination })
  )
  const fsFileInfo = useRecoilValue(
    PathFileInfoSelectorFamily({ path, offPocket: true })
  )

  const files: FileCopy[] = useMemo(
    () =>
      fsFileInfo.map((f) => ({
        origin: `${f.path}/${f.filename}`,
        destination: `${pocketPath}/${destination}/${f.filename}`,
        exists:
          pocketFileInfo.find(
            (pF) => pF.filename === f.filename && pF.crc32 === f.crc32
          ) !== undefined,
      })),
    [pocketFileInfo, fsFileInfo]
  )

  const status: FileStatus = useMemo(() => {
    if (pocketFileInfo.length === 0) return "none"
    if (files.every(({ exists }) => exists)) return "complete"
    return "partial"
  }, [pocketFileInfo, files])

  return <>{children(status, files)}</>
}

const ArchiveOrgItem = ({
  name,
  destination,
  extensions,
}: {
  name: string
  destination: string
  extensions?: string[]
}) => {
  const {
    installRequiredFiles,
    percent,
    inProgress,
    lastMessage,
    remainingTime,
  } = useInstallRequiredFiles()

  const invalidateFileSystem = useInvalidateFileSystem()

  return (
    <div className="fetch__list-item">
      {inProgress && (
        <Modal>
          <Progress
            percent={percent}
            message={lastMessage}
            remainingTime={remainingTime}
          />
        </Modal>
      )}

      <div>
        <div className="fetch__list-item-type">Archive.org</div>
        <div className="fetch__list-item-name">{name}</div>
        <div className="fetch__list-item-destination">{destination}</div>
      </div>

      <Suspense fallback={<FileStatus status="waiting" files={[]} />}>
        <ArchiveOrgStatus
          name={name}
          destination={destination}
          extensions={extensions}
        >
          {(status, files) => (
            <>
              <FileStatus status={status} files={files} />

              <button
                onClick={async () => {
                  await installRequiredFiles(
                    files.filter(({ exists }) => !exists),
                    `https://archive.org/download/${name}`
                  )
                  invalidateFileSystem()
                }}
              >
                Fetch
              </button>
            </>
          )}
        </ArchiveOrgStatus>
      </Suspense>

      <button>Remove</button>
    </div>
  )
}

const ArchiveOrgStatus = ({
  name,
  destination,
  extensions,
  children,
}: {
  name: string
  destination: string
  extensions?: string[]
  children: (status: FileStatus, files: RequiredFileInfo[]) => ReactNode
}) => {
  const metadata = useRecoilValue(
    ArchiveMetadataSelectorFamily({ archiveName: name })
  )
  const fileInfo = useRecoilValue(
    PathFileInfoSelectorFamily({ path: destination })
  )

  const filteredMetadata = useMemo(
    () =>
      metadata.filter((m) => {
        if (!extensions || extensions.length === 0) return true
        return extensions.some((e) => m.name.endsWith(e))
      }),
    [metadata, extensions]
  )

  console.log({ filteredMetadata, fileInfo })

  const files: RequiredFileInfo[] = useMemo(() => {
    return filteredMetadata.map((m) => {
      const exists =
        fileInfo.find((fi) => {
          if (comparePaths(m.name.split("/"), splitAsPath(fi.filename))){
            return fi.crc32 && parseInt(m.crc32, 16) === fi.crc32
          }
          return false
        }) !== undefined

      return {
        filename: m.name,
        path: destination,
        exists,
        type: "core",
      }
    })
  }, [filteredMetadata, fileInfo, destination])

  const status: FileStatus = useMemo(() => {
    // do this better (needs to take crc32 into account)
    if (fileInfo.length === 0) return "none"
    if (files.every(({ exists }) => exists)) return "complete"
    return "partial"
  }, [metadata, fileInfo, files])

  return <>{children(status, files)}</>
}

const FileStatus = ({
  status,
  files,
}: {
  status: FileStatus
  files: { exists: boolean }[]
}) => {
  const statusText = useMemo(() => {
    if (status === "waiting") return "loading..."
    return `${files.filter(({ exists }) => exists).length} / ${
      files.length
    } files`
  }, [files, status])

  return (
    <div className={`fetch__status fetch__status--${status}`}>{statusText}</div>
  )
}
