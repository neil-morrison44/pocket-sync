import { ReactNode, Suspense, useCallback, useMemo, useState } from "react"

import "./index.css"
import { useRecoilValue, useSetRecoilState } from "recoil"
import {
  ArchiveMetadataSelectorFamily,
  PathFileInfoSelectorFamily,
} from "../../recoil/archive/selectors"
import { useInstallRequiredFiles } from "../../hooks/useInstallRequiredFiles"
import { Progress } from "../progress"
import { FetchFileMetadataWithStatus, FileCopy } from "../../types"
import { Modal } from "../modal"
import { useInvalidateConfig } from "../../hooks/invalidation"
import { Controls } from "../controls"
import { PocketSyncConfigSelector } from "../../recoil/config/selectors"
import { NewFetch } from "./new"
import { invokeCopyFiles } from "../../utils/invokes"
import { pocketPathAtom } from "../../recoil/atoms"
import { comparePaths } from "../../utils/comparePaths"
import { splitAsPath } from "../../utils/splitAsPath"
import { archiveBumpAtom } from "../../recoil/archive/atoms"
import { useUpdateConfig } from "../settings/hooks/useUpdateConfig"
import { confirm } from "@tauri-apps/api/dialog"
import { useTranslation } from "react-i18next"
import { ControlsButton } from "../controls/inputs/button"

type FileStatus = "complete" | "partial" | "none" | "waiting" | "copying"

export const Fetch = () => {
  const config = useRecoilValue(PocketSyncConfigSelector)
  const updateConfig = useUpdateConfig()
  const [newFetchOpen, setNewFetchOpen] = useState<boolean>(false)
  const { t } = useTranslation("fetch")

  const invalidateConfig = useInvalidateConfig()
  const setArchiveBumpAtom = useSetRecoilState(archiveBumpAtom)
  const list = config.fetches || []

  const removeItem = useCallback(
    async (index: number) => {
      const confirmed = await confirm(t("remove_confirm"), { type: "warning" })
      if (!confirmed) return
      updateConfig("fetches", (fetches) => {
        const clonedFetches = [...(fetches ?? [])]
        clonedFetches.splice(index, 1)
        return clonedFetches
      })
    },
    [t, updateConfig]
  )

  return (
    <div className="fetch">
      <Controls>
        <ControlsButton onClick={() => setNewFetchOpen(true)}>
          {t("controls.add_fetch_item")}
        </ControlsButton>
        <ControlsButton
          onClick={() => {
            invalidateConfig()
            setArchiveBumpAtom((c) => c + 1)
          }}
        >
          {t("controls.refresh")}
        </ControlsButton>
      </Controls>
      {newFetchOpen && <NewFetch onClose={() => setNewFetchOpen(false)} />}
      <div className="fetch__list">
        <Suspense>
          {list.map((item, index) => {
            switch (item.type) {
              case "archive.org":
                return (
                  <ArchiveOrgItem
                    key={item.name}
                    onRemove={() => removeItem(index)}
                    {...item}
                  />
                )
              case "filesystem":
                return (
                  <FileSystemItem
                    key={`${item.path}->${item.destination}`}
                    onRemove={() => removeItem(index)}
                    {...item}
                  />
                )
              default:
                return null
            }
          })}
        </Suspense>
      </div>
    </div>
  )
}

const FileSystemItem = ({
  path,
  destination,
  onRemove,
}: {
  path: string
  destination: string
  onRemove: () => void
}) => {
  const [isCopying, setIsCopying] = useState<boolean>(false)

  const { percent, inProgress, lastMessage, remainingTime } =
    useInstallRequiredFiles()

  const { t } = useTranslation("fetch")

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

      <div className="fetch__list-item-info">
        <div className="fetch__list-item-type">{t("types.filesystem")}</div>
        <div className="fetch__list-item-name">{path}</div>
        <div className="fetch__list-item-destination">{destination}</div>
      </div>

      {isCopying && <FileStatus status="copying" files={[]} />}
      {!isCopying && (
        <Suspense fallback={<FileStatus status="waiting" files={[]} />}>
          <FileSystemStatus path={path} destination={destination}>
            {(status, files) => (
              <>
                <FileStatus status={status} files={files} />
                <button
                  onClick={async () => {
                    setIsCopying(true)
                    await invokeCopyFiles(files.filter(({ exists }) => !exists))
                    setIsCopying(false)
                  }}
                >
                  {t("fetch_button")}
                </button>
              </>
            )}
          </FileSystemStatus>
        </Suspense>
      )}

      <button onClick={onRemove}>{t("remove_button")}</button>
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
        origin: `${f.path}/${f.name}`,
        destination: `${pocketPath}/${destination}/${f.name}`,
        mtime: f.mtime,
        exists:
          pocketFileInfo.find(
            (pF) =>
              pF.name === f.name && pF.mtime && f.mtime && pF.mtime >= f.mtime
          ) !== undefined,
      })),
    [fsFileInfo, pocketPath, destination, pocketFileInfo]
  )

  const status: FileStatus = useMemo(() => {
    if (files.length > 0 && files.every(({ exists }) => exists))
      return "complete"
    if (files.some(({ exists }) => exists)) return "partial"
    return "none"
  }, [files])

  return <>{children(status, files)}</>
}

const ArchiveOrgItem = ({
  name,
  destination,
  extensions,
  onRemove,
}: {
  name: string
  destination: string
  extensions?: string[]
  onRemove: () => void
}) => {
  const {
    installRequiredFiles,
    percent,
    inProgress,
    lastMessage,
    remainingTime,
  } = useInstallRequiredFiles()
  const { t } = useTranslation("fetch")

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

      <div className="fetch__list-item-info">
        <div className="fetch__list-item-type">{t("types.archive_org")}</div>
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
                    files
                      .filter(({ exists }) => !exists)
                      .map((f) => ({
                        name: f.name,
                        path: `${f.path.replace(/^(\/|\\)+/, "")}/${f.name}`,
                        required: true,
                        status: {
                          type: "MissingButOnArchive",
                          url: f.name,
                          crc32: "",
                        },
                      })),
                    `https://archive.org/download/${name}`
                  )
                }}
              >
                {t("fetch_button")}
              </button>
            </>
          )}
        </ArchiveOrgStatus>
      </Suspense>
      <button onClick={onRemove}>{t("remove_button")}</button>
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
  children: (
    status: FileStatus,
    files: FetchFileMetadataWithStatus[]
  ) => ReactNode
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
        if (!m.crc32) return false
        if (!extensions || extensions.length === 0) return true
        return extensions.some((e) => m.name.endsWith(e))
      }),
    [metadata, extensions]
  )

  const files: FetchFileMetadataWithStatus[] = useMemo(() => {
    return filteredMetadata.map((m) => {
      const exists =
        fileInfo.find((fi) => {
          if (comparePaths(m.name.split("/"), [...splitAsPath(fi.name)])) {
            return fi.mtime && parseInt(m.mtime) * 1000 <= fi.mtime
          }
          return false
        }) !== undefined

      return {
        name: m.name,
        path: destination,
        mtime: parseInt(m.mtime) * 1000,
        exists,
      }
    })
  }, [filteredMetadata, fileInfo, destination])

  const status: FileStatus = useMemo(() => {
    if (files.length > 0 && files.every(({ exists }) => exists))
      return "complete"
    if (files.length > 0 && files.some(({ exists }) => exists)) return "partial"
    return "none"
  }, [files])

  return <>{children(status, files)}</>
}

const FileStatus = ({
  status,
  files,
}: {
  status: FileStatus
  files: { exists: boolean }[]
}) => {
  const { t } = useTranslation("fetch")

  const statusText = useMemo(() => {
    if (status === "copying") return t("copying")
    if (status === "waiting") return t("loading")
    const count = files.filter(({ exists }) => exists).length
    const total = files.length
    return t("file_count", { count, total })
  }, [files, status, t])

  return (
    <div className={`fetch__status fetch__status--${status}`}>{statusText}</div>
  )
}
