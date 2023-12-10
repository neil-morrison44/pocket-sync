import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { useInstallRequiredFiles } from "../../../../hooks/useInstallRequiredFiles"
import { RequiredFilesWithStatusSelectorFamily } from "../../../../recoil/archive/selectors"
import { skipAlternateAssetsSelector } from "../../../../recoil/config/selectors"
import { Modal } from "../../../modal"
import { Progress } from "../../../progress"
import { Tip } from "../../../tip"
import { useTranslation } from "react-i18next"

import "./index.css"
import { RequiredFileRow } from "./row"
import { useUpdateConfig } from "../../../settings/hooks/useUpdateConfig"
import { useHasArchiveLink } from "../../../../hooks/useHasArchiveLink"

const STATUS_SORT_ORDER = [
  "wrong",
  "downloadable",
  "ok",
  "not_in_archive",
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
  const requiredFiles = useRecoilValue(
    RequiredFilesWithStatusSelectorFamily(coreName)
  )
  const { t } = useTranslation("core_info_required_files")
  const {
    installRequiredFiles,
    percent,
    inProgress,
    lastMessage,
    remainingTime,
  } = useInstallRequiredFiles()

  const skipAlternateAssets = useRecoilValue(skipAlternateAssetsSelector)
  const updateConfig = useUpdateConfig()
  const hasArchiveLink = useHasArchiveLink()

  const sortedRequiredFiles = useMemo(() => {
    return [...requiredFiles].sort((a, b) => {
      if (a.status === b.status) return a.filename.localeCompare(b.filename)

      return (
        STATUS_SORT_ORDER.indexOf(a.status) -
        STATUS_SORT_ORDER.indexOf(b.status)
      )
    })
  }, [requiredFiles])

  return (
    <Modal className="load-required-files">
      <h2>{t("title")}</h2>

      {inProgress && (
        <Progress
          percent={percent}
          message={lastMessage}
          remainingTime={remainingTime}
        />
      )}

      {!inProgress && (
        <>
          <div className="load-required-files__files">
            {sortedRequiredFiles.map((r) => (
              <RequiredFileRow
                info={r}
                key={`${r.path}/${r.filename}`}
                hasArchiveLink={hasArchiveLink}
              />
            ))}
          </div>

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
              <button
                onClick={() =>
                  installRequiredFiles(
                    requiredFiles.filter(
                      ({ status }) =>
                        status === "downloadable" ||
                        status === "wrong" ||
                        status === "at_root" ||
                        status === "at_root_match"
                    )
                  )
                }
              >
                {t("download_all")}
              </button>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}
