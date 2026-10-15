import { ReactNode, Suspense, useCallback, useMemo, useState } from "react"

import "./index.css"

import {
  ArchiveMetadataSelectorFamily,
  PathFileInfoSelectorFamily,
} from "../../jotai/archive/selectors"
import { useInstallRequiredFiles } from "../../hooks/useInstallRequiredFiles"
import { FetchFileMetadataWithStatus, FileCopy } from "../../types"
import { Controls, ControlsActions } from "../controls"
import { PocketSyncConfigSelector } from "../../jotai/config/selectors"
import { NewFetch } from "./new"
import { invokeCopyFiles } from "../../utils/invokes"
import { comparePaths } from "../../utils/comparePaths"
import { splitAsPath } from "../../utils/splitAsPath"
import { archiveBumpAtom } from "../../jotai/archive/atoms"
import { useUpdateConfig } from "../settings/hooks/useUpdateConfig"
import { confirm } from "@tauri-apps/plugin-dialog"
import { Trans, useTranslation } from "react-i18next"
import { ControlsButton } from "../controls/inputs/button"
import Button from "../ui/Button"
import EmptyState from "../ui/EmptyState"
import { ProgressLoader, ProgressLoaderInner } from "../loader/progress"
import { usePreventGlobalZipInstallModal } from "../../hooks/usePreventGlobalZipInstall"
import { FetchInfoSelectorFamily } from "../../jotai/fetch/selectors"
import { useAtomValue, useSetAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import { pocketPathAtom } from "../../jotai/atoms"
import { fetchLastRunAtom, fetchSourceKey } from "../../jotai/fetch/atoms"
import { openFolder } from "../../utils/openFolder"
import { TimeAgo } from "../newsFeed/timeAgo"
import { Link } from "../link"
import Icon from "../ui/Icon"
import IconButton from "../ui/IconButton"
import Skeleton from "../ui/Skeleton"
import Tag, { TagList } from "../ui/Tag"
import Tile from "../ui/Tile"

type FileStatus = "complete" | "partial" | "none" | "waiting"

export const Fetch = () => {
  const config = useAtomValue(PocketSyncConfigSelector)
  const updateConfig = useUpdateConfig()
  const [newFetchOpen, setNewFetchOpen] = useState<boolean>(false)
  const { t } = useTranslation("fetch")

  usePreventGlobalZipInstallModal()

  const setArchiveBumpAtom = useSetAtom(archiveBumpAtom)
  const list = config.fetches || []

  const removeItem = useCallback(
    async (index: number) => {
      const confirmed = await confirm(t("remove_confirm"), { kind: "warning" })
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
        <ControlsActions>
          <ControlsButton onClick={() => setNewFetchOpen(true)}>
            {t("controls.add_fetch_item")}
          </ControlsButton>
          <ControlsButton
            onClick={() => {
              setArchiveBumpAtom((c) => c + 1)
            }}
          >
            {t("controls.refresh")}
          </ControlsButton>
        </ControlsActions>
      </Controls>
      {newFetchOpen && <NewFetch onClose={() => setNewFetchOpen(false)} />}
      {list.length === 0 && (
        <EmptyState
          icon="download"
          title={t("empty.title")}
          action={
            <Button theme="primary" onClick={() => setNewFetchOpen(true)}>
              {t("controls.add_fetch_item")}
            </Button>
          }
        >
          {t("empty.text")}
        </EmptyState>
      )}
      <div className="fetch__list">
        {list.map((item, index) => {
          switch (item.type) {
            case "archive.org":
              return (
                <Suspense key={item.name}>
                  <ArchiveOrgItem
                    onRemove={() => removeItem(index)}
                    {...item}
                  />
                </Suspense>
              )
            case "filesystem":
              return (
                <Suspense key={`${item.path}->${item.destination}`}>
                  <FileSystemItem
                    onRemove={() => removeItem(index)}
                    {...item}
                  />
                </Suspense>
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
  onRemove,
}: {
  path: string
  destination: string
  onRemove: () => void
}) => {
  const [isCopying, setIsCopying] = useState<boolean>(false)
  const recordFetch = useRecordFetch(fetchSourceKey(path, destination))

  const copy = useCallback(
    async (files: FileCopy[]) => {
      setIsCopying(true)
      await invokeCopyFiles(files.filter(({ exists }) => !exists))
      setIsCopying(false)
      recordFetch()
    },
    [recordFetch]
  )

  return (
    <Suspense
      fallback={
        <FetchTile
          icon="folder"
          title={folderName(path)}
          subtitle={<span className="fetch__path">{path}</span>}
          destination={destination}
          status={<FileStatus status="waiting" files={[]} />}
          onRemove={onRemove}
        />
      }
    >
      <FileSystemStatus path={path} destination={destination}>
        {(status, files) => (
          <FetchTile
            icon="folder"
            title={folderName(path)}
            subtitle={<span className="fetch__path">{path}</span>}
            destination={destination}
            status={
              isCopying ? (
                <ProgressLoader name="copy_files" />
              ) : (
                <FileStatus status={status} files={files} />
              )
            }
            fetchDisabled={isCopying || status === "complete"}
            sourceKey={fetchSourceKey(path, destination)}
            onFetch={() => copy(files)}
            onRemove={onRemove}
          />
        )}
      </FileSystemStatus>
    </Suspense>
  )
}

/** Saves "now" as the source's last fetch time. */
const useRecordFetch = (sourceKey: string) => {
  const save = useAtomCallback(
    useCallback(
      (get, set) => {
        const current = get(fetchLastRunAtom)
        const write = (runs: Record<string, number>) =>
          set(fetchLastRunAtom, { ...runs, [sourceKey]: Date.now() })
        if (current instanceof Promise) return current.then(write)
        return write(current)
      },
      [sourceKey]
    )
  )
  return useCallback(() => {
    save()
  }, [save])
}

/** The last folder of a path, as the source's title. */
const folderName = (path: string) =>
  splitAsPath(path).filter(Boolean).pop() ?? path

type FetchTileProps = {
  icon: "folder" | "archive"
  title: ReactNode
  subtitle: ReactNode
  destination: string
  extensions?: string[]
  /** File count tag, or the progress while fetching. */
  status: ReactNode
  /** Leaves the Fetch button out while the status is loading. */
  onFetch?: () => void
  fetchDisabled?: boolean
  /** Identifies the source for its last fetch time. */
  sourceKey?: string
  onRemove: () => void
}

/** One fetch source: what it copies, where to, its status and actions. */
const FetchTile = ({
  icon,
  title,
  subtitle,
  destination,
  extensions,
  status,
  onFetch,
  fetchDisabled = false,
  sourceKey,
  onRemove,
}: FetchTileProps) => {
  const { t } = useTranslation("fetch")
  const pocketPath = useAtomValue(pocketPathAtom)
  const lastRuns = useAtomValue(fetchLastRunAtom)
  const lastRun = sourceKey ? lastRuns[sourceKey] : undefined
  return (
    <Tile
      orientation="horizontal"
      className="fetch__item"
      media={
        <span className="tile__icon">
          <Icon icon={icon} size={24} />
        </span>
      }
      title={title}
      subtitle={subtitle}
      meta={
        <>
          <span>{t("to_destination", { destination })}</span>
          {extensions && extensions.length > 0 && (
            <span>
              {t("only_extensions", { extensions: extensions.join(", ") })}
            </span>
          )}
          {lastRun && (
            <span>
              <Trans
                t={t}
                i18nKey="last_fetched"
                components={{ time: <TimeAgo since={lastRun} /> }}
              />
            </span>
          )}
        </>
      }
      tags={status}
      actions={
        <>
          {onFetch && (
            <Button icon="download" disabled={fetchDisabled} onClick={onFetch}>
              {t("fetch_button")}
            </Button>
          )}
          {pocketPath && (
            <IconButton
              theme="tertiary"
              icon="folder"
              label={t("open_destination")}
              onClick={() => openFolder(`${pocketPath}/${destination}`)}
            />
          )}
          <IconButton
            theme="destructive"
            icon="trash"
            label={t("remove_button")}
            onClick={onRemove}
          />
        </>
      }
    />
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
  const { pocketPath, pocketFileInfo, fsFileInfo } = useAtomValue(
    FetchInfoSelectorFamily({ origin: path, destination })
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
  const { installRequiredFiles, inProgress, percent, message } =
    useInstallRequiredFiles(
      `install_archive_files-${btoa(name).replaceAll("=", "")}`
    )
  const { t } = useTranslation("fetch")
  const recordArchiveFetch = useRecordFetch(fetchSourceKey(name, destination))

  const subtitle = (
    <Link href={`https://archive.org/details/${name}`}>
      {t("archive_link", { name })}
    </Link>
  )

  return (
    <Suspense
      fallback={
        <FetchTile
          icon="archive"
          title={name}
          subtitle={subtitle}
          destination={destination}
          extensions={extensions}
          status={<FileStatus status="waiting" files={[]} />}
          onRemove={onRemove}
        />
      }
    >
      <ArchiveOrgStatus
        name={name}
        destination={destination}
        extensions={extensions}
      >
        {(status, files) => (
          <FetchTile
            icon="archive"
            title={name}
            subtitle={subtitle}
            destination={destination}
            extensions={extensions}
            status={
              inProgress ? (
                <ProgressLoaderInner
                  percent={percent}
                  message={message}
                  showToken={false}
                />
              ) : (
                <FileStatus status={status} files={files} />
              )
            }
            fetchDisabled={inProgress || status === "complete"}
            sourceKey={fetchSourceKey(name, destination)}
            onFetch={() =>
              installRequiredFiles(
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
                      name: f.name,
                      mtime: "0",
                    },
                  })),
                `https://archive.org/download/${name}`
              ).then(recordArchiveFetch)
            }
            onRemove={onRemove}
          />
        )}
      </ArchiveOrgStatus>
    </Suspense>
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
  const metadata = useAtomValue(
    ArchiveMetadataSelectorFamily({ archiveName: name })
  )
  const fileInfo = useAtomValue(
    PathFileInfoSelectorFamily({ path: destination })
  )

  const filteredMetadata = useMemo(() => {
    if (!metadata) return []

    return metadata.filter((m) => {
      if (!m.crc32) return false
      if (!extensions || extensions.length === 0) return true
      return extensions.some((e) => m.name.endsWith(e))
    })
  }, [metadata, extensions])

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

  if (status === "waiting") return <Skeleton width={96} />

  const total = files.length
  const missing = files.filter(({ exists }) => !exists).length
  return (
    <TagList>
      {total === 0 && <Tag>{t("status.empty")}</Tag>}
      {total > 0 && missing === 0 && (
        <Tag theme="accent" icon="check">
          {t("status.complete", { total })}
        </Tag>
      )}
      {total > 0 && missing > 0 && (
        <Tag theme={missing < total ? "warning" : "neutral"}>
          {t("status.to_fetch", { missing, total })}
        </Tag>
      )}
    </TagList>
  )
}
