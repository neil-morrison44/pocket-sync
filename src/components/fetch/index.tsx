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
  // const list: FetchTypes[] = [
  //   {
  //     type: "archive.org",
  //     name: "fpga-gnw-opt",
  //     destination: "Assets/gameandwatch/common/optimised",
  //   },
  // ]
  const list = config.fetches || []

  return (
    <div className="fetch">
      <Controls
        controls={[
          {
            type: "button",
            text: "Add fetch location",
            onClick: () => {
              setNewFetchOpen(true)
              console.log("hello")
            },
          },
        ]}
      />

      {newFetchOpen && <NewFetch onClose={() => setNewFetchOpen(false)} />}

      <div className="fetch__list">
        {list.map((item) => {
          switch (item.type) {
            case "archive.org":
              return <ArchiveOrgItem key={item.name} {...item} />
            default:
              return null
          }
        })}
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
              <FileStatus status={status} />

              <button
                onClick={async () => {
                  console.log({ files })
                  await installRequiredFiles(
                    files,
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

  const status: FileStatus = useMemo(() => {
    // do this better (needs to take crc32 into account)
    if (fileInfo.length === 0) return "none"
    if (fileInfo.length === metadata.length) return "complete"
    return "partial"
  }, [metadata, fileInfo])

  console.log({ metadata, fileInfo })

  const files: RequiredFileInfo[] = useMemo(() => {
    return metadata
      .filter((m) => {
        if (!extensions || extensions.length === 0) return true
        return extensions.some((e) => m.name.endsWith(e))
      })
      .map((m) => {
        return {
          filename: m.name,
          path: path,
          // this should check if the file exists & matches the crc32 and be used to filter
          // out already downloaded ones
          exists: false,
          type: "core",
        }
      })
  }, [metadata, path])

  return <>{children(status, files)}</>
}

const FileStatus = ({ status }: { status: FileStatus }) => {
  return (
    <div className={`fetch__status fetch__status--${status}`}>{status}</div>
  )
}
