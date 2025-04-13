import { Suspense, useMemo } from "react"

import { useInstallRequiredFiles } from "../../../../hooks/useInstallRequiredFiles"
import { skipAlternateAssetsSelector } from "../../../../recoil/config/selectors"
import { Modal } from "../../../modal"
import { Progress } from "../../../progress"
import { Tip } from "../../../tip"
import { useTranslation } from "react-i18next"

import "./index.css"
import { RequiredFileRow } from "./row"
import { useUpdateConfig } from "../../../settings/hooks/useUpdateConfig"
import { useHasArchiveLink } from "../../../../hooks/useHasArchiveLink"
import { RequiredFileInfoSelectorFamily } from "../../../../recoil/requiredFiles/selectors"
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

export const LoadRequiredFiles = ({
  coreName,
  onClose,
}: LoadRequiredFilesProps) => {
  const { t } = useTranslation("core_info_required_files")
  const { installRequiredFiles, percent, inProgress, message, remainingTime } =
    useInstallRequiredFiles()

  const skipAlternateAssets = useAtomValue(skipAlternateAssetsSelector)
  const updateConfig = useUpdateConfig()
  const hasArchiveLink = useHasArchiveLink()

  return (
    <Modal className="load-required-files">
      <h2>{t("title")}</h2>

      {inProgress && (
        <>
          <Progress
            percent={percent}
            message={message?.param}
            remainingTime={remainingTime}
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
          {!hasArchiveLink && <Tip>{t("no_link_tip")}</Tip>}

          <div className="load-required-files__skip-notice">
            <label className="load-required-files__skip-input">
              {t("skip_alternates_label")}
              <input
                type="checkbox"
                checked={skipAlternateAssets}
                onChange={({ target }) =>
                  updateConfig("skipAlternateAssets", target.checked)
                }
              />
            </label>
          </div>

          <div className="load-required-files__buttons">
            <button onClick={onClose}>{t("close")}</button>

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
  return (
    <button
      onClick={() =>
        installRequiredFiles(
          requiredFiles.filter(
            ({ status }) =>
              status.type !== "Exists" && status.type !== "NotFound"
          )
        )
      }
    >
      {t("download_all")}
    </button>
  )
}

type RequiredFilesListProps = {
  coreName: string
}

const RequiredFilesList = ({ coreName }: RequiredFilesListProps) => {
  const requiredFiles = useAtomValue(RequiredFileInfoSelectorFamily(coreName))
  const sortedRequiredFiles = useMemo(() => {
    return [...requiredFiles].sort((a, b) => {
      if (a.status === b.status) return a.name.localeCompare(b.name)

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
