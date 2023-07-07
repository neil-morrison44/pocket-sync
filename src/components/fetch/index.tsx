import React, { ReactNode, Suspense, useMemo, useState } from "react"

import "./index.css"
import { useRecoilValue } from "recoil"
import {
  ArchiveMetadataSelectorFamily,
  PathFileInfoSelectorFamily,
} from "../../recoil/archive/selectors"
import { useInstallRequiredFiles } from "../../hooks/useInstallRequiredFiles"
import { Progress } from "../progress"
import { RequiredFileInfo } from "../../types"
import { Modal } from "../modal"
import { useInvalidateFileSystem } from "../../hooks/invalidation"
import { Controls } from "../controls"
import { PocketSyncConfigSelector } from "../../recoil/config/selectors"
import { NewFetch } from "./new"

type FileStatus = "complete" | "partial" | "none" | "waiting"

export const Fetch = () => {
  const config = useRecoilValue(PocketSyncConfigSelector)
  const [newFetchOpen, setNewFetchOpen] = useState<boolean>(false)
  const list = config.fetches || []

  console.log({ list })

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
  return (
    <div className="fetch__list-item">
      <div>
        <div className="fetch__list-item-type">Local Files</div>
        <div className="fetch__list-item-name">{path}</div>
        <div className="fetch__list-item-destination">{destination}</div>
      </div>
    </div>
  )
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

      <Suspense fallback={<FileStatus status="waiting" />}>
        <ArchiveOrgStatus
          name={name}
          path={destination}
          extensions={extensions}
        >
          {(status, files) => (
            <>
              <FileStatus status={status} files={files} />

              <button
                onClick={async () => {
                  console.log({ files })
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
  path,
  extensions,
  children,
}: {
  name: string
  path: string
  extensions?: string[]
  children: (status: FileStatus, files: RequiredFileInfo[]) => ReactNode
}) => {
  const metadata = useRecoilValue(
    ArchiveMetadataSelectorFamily({ archiveName: name })
  )
  const fileInfo = useRecoilValue(PathFileInfoSelectorFamily({ path }))

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
          if (`/${m.name}` === fi.filename.replace(/\\\//g, "/"))
            return fi.crc32 && m.crc32.endsWith(fi.crc32.toString(16))
          return false
        }) !== undefined

      return {
        filename: m.name,
        path,
        exists,
        type: "core",
      }
    })
  }, [filteredMetadata, path])

  const status: FileStatus = useMemo(() => {
    // do this better (needs to take crc32 into account)
    if (fileInfo.length === 0) return "none"
    if (files.every(({ exists }) => exists)) return "complete"
    return "partial"
  }, [metadata, fileInfo, files])

  console.log({ files })

  return <>{children(status, files)}</>
}

const FileStatus = ({
  status,
  files,
}: {
  status: FileStatus
  files: RequiredFileInfo[]
}) => {
  const statusText = useMemo(() => {
    return `${files.filter(({ exists }) => exists).length} / ${
      files.length
    } files`
  }, [files])

  return (
    <div className={`fetch__status fetch__status--${status}`}>{statusText}</div>
  )
}
