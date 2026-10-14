import { Suspense, useMemo } from "react"

import { useInstallRequiredFiles } from "../../../../hooks/useInstallRequiredFiles"
import { skipAlternateAssetsSelector } from "../../../../jotai/config/selectors"
import { Modal, ModalSuspense } from "../../../modal"
import Button from "../../../ui/Button"
import Switch from "../../../ui/Switch"
import { Progress } from "../../../progress"
import Callout from "../../../ui/Callout"
import { useTranslation } from "react-i18next"

import "./index.css"
import { RequiredFileRow } from "./row"
import { useUpdateConfig } from "../../../settings/hooks/useUpdateConfig"
import { useHasArchiveLink } from "../../../../hooks/useHasArchiveLink"
import { RequiredFileInfoSelectorFamily } from "../../../../jotai/requiredFiles/selectors"
import { DataSlotFile } from "../../../../types"
import { Loader } from "../../../loader"
import { JobsStopButton } from "../../../jobs/stop"
import { useAtomValue } from "jotai"

const STATUS_SORT_ORDER = [
  "RootNeedsUpdate",
  "FoundAtRoot",
  "NeedsUpdateFromArchive",
  "MissingButOnArchive",
  "NotFound",
  "Exists",
  undefined,
]

type LoadRequiredFilesProps = {
  coreName: string
  onClose: () => void
}

const LoadRequiredFilesContent = ({
  coreName,
  onClose,
}: LoadRequiredFilesProps) => {
  const { t } = useTranslation("core_info_required_files")
  const {
    installRequiredFiles,
    percent,
    inProgress,
    message,
    remainingTime,
    speed,
  } = useInstallRequiredFiles()

  const skipAlternateAssets = useAtomValue(skipAlternateAssetsSelector)
  const updateConfig = useUpdateConfig()
  const hasArchiveLink = useHasArchiveLink()

  return (
    <Modal
      className="load-required-files"
      title={t("title")}
      onClose={inProgress ? undefined : onClose}
    >
      {inProgress && (
        <>
          <Progress
            percent={percent}
            message={message?.param}
            remainingTime={remainingTime}
            speed={speed}
          />
          <JobsStopButton jobId="install_archive_files" />
        </>
      )}

      {!inProgress && (
        <>
          <Suspense
            fallback={
              <div
                className="load-required-files__files"
                style={{ padding: "20px" }}
              >
                <Loader className="loader--no-background" />
              </div>
            }
          >
            <RequiredFilesList coreName={coreName} />
          </Suspense>
          {!hasArchiveLink && <Callout>{t("no_link_tip")}</Callout>}

          <div className="load-required-files__buttons">
            <Switch
              className="load-required-files__skip"
              label={t("skip_alternates_label")}
              value={skipAlternateAssets}
              onChange={(checked) =>
                updateConfig("skipAlternateAssets", checked)
              }
            />

            {hasArchiveLink && (
              <Suspense>
                <RequiredFilesButton
                  installRequiredFiles={installRequiredFiles}
                  coreName={coreName}
                />
              </Suspense>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}

type RequiredFilesButtonProps = {
  installRequiredFiles: (
    files: DataSlotFile[],
    other_archive_url?: string | undefined
  ) => Promise<void>
  coreName: string
}

const RequiredFilesButton = ({
  installRequiredFiles,
  coreName,
}: RequiredFilesButtonProps) => {
  const requiredFiles = useAtomValue(RequiredFileInfoSelectorFamily(coreName))
  const { t } = useTranslation("core_info_required_files")
  const toDownload = requiredFiles.filter(
    ({ status }) => status.type !== "Exists" && status.type !== "NotFound"
  )
  return (
    <Button
      theme="primary"
      icon="download"
      disabled={toDownload.length === 0}
      onClick={() => installRequiredFiles(toDownload)}
    >
      {t("download_all")}
    </Button>
  )
}

type RequiredFilesListProps = {
  coreName: string
}

const RequiredFilesList = ({ coreName }: RequiredFilesListProps) => {
  const requiredFiles = useAtomValue(RequiredFileInfoSelectorFamily(coreName))
  const sortedRequiredFiles = useMemo(() => {
    return [...requiredFiles].sort((a, b) => {
      if (a.status.type === b.status.type) {
        if (
          (a.status.type === "MissingButOnArchive" ||
            a.status.type === "NeedsUpdateFromArchive") &&
          a.status.size &&
          // @ts-expect-error already know the statuses are the sam
          b.status.size
        ) {
          // @ts-expect-error already know the statuses are the same
          return parseInt(b.status.size) - parseInt(a.status.size)
        }

        return a.name.localeCompare(b.name)
      }

      return (
        STATUS_SORT_ORDER.indexOf(a.status.type) -
        STATUS_SORT_ORDER.indexOf(b.status.type)
      )
    })
  }, [requiredFiles])

  return (
    <div className="load-required-files__files">
      {sortedRequiredFiles.map((r) => (
        <RequiredFileRow info={r} key={r.path} />
      ))}
    </div>
  )
}

/** Opens right away with a loader while its data loads. */
export const LoadRequiredFiles = (props: LoadRequiredFilesProps) => {
  const { t } = useTranslation("core_info_required_files")
  return (
    <ModalSuspense
      className="load-required-files"
      title={t("title")}
      onClose={props.onClose}
    >
      <LoadRequiredFilesContent {...props} />
    </ModalSuspense>
  )
}
