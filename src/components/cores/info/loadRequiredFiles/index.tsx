import { useMemo } from "react"
import { useRecoilValue } from "recoil"
import { useInstallRequiredFiles } from "../../../../hooks/useInstallRequiredFiles"
import { RequiredFilesWithStatusSelectorFamily } from "../../../../recoil/archive/selectors"
import {
  PocketSyncConfigSelector,
  skipAlternateAssetsSelector,
} from "../../../../recoil/config/selectors"
import { Modal } from "../../../modal"
import { Progress } from "../../../progress"
import { Tip } from "../../../tip"

import "./index.css"
import { RequiredFileRow } from "./row"

const STATUS_SORT_ORDER = [
  "wrong",
  "downloadable",
  "ok",
  "not-in-archive",
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
  const pocketSyncConfig = useRecoilValue(PocketSyncConfigSelector)
  const {
    installRequiredFiles,
    percent,
    inProgress,
    lastMessage,
    remainingTime,
  } = useInstallRequiredFiles()

  const skipAlternateAssets = useRecoilValue(skipAlternateAssetsSelector)

  const hasArchiveLink = useMemo(
    () =>
      pocketSyncConfig.archive_url !== null &&
      pocketSyncConfig.archive_url !== "",
    [pocketSyncConfig]
  )

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
      <h2>{"Required Files"}</h2>

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

          {!hasArchiveLink && (
            <Tip>
              {
                "Please view the Settings section for more options with required files"
              }
            </Tip>
          )}

          {skipAlternateAssets && (
            <div className="load-required-files__skip-notice">
              {"(Alternative files skipped)"}
            </div>
          )}

          <div className="load-required-files__buttons">
            <button onClick={onClose}>{"Close"}</button>

            {hasArchiveLink && (
              <button
                onClick={() =>
                  installRequiredFiles(
                    requiredFiles.filter(
                      ({ status }) =>
                        status === "downloadable" || status === "wrong"
                    )
                  )
                }
              >
                {"Download All"}
              </button>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}
